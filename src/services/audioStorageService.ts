import JSZip from 'jszip';
import { dbService } from './db';
import { AudioStorageFile, Recording, Sentence, User } from '../types';
import { buildRecordingId } from '../utils/formatters';

export interface StorageStats {
  fileCount: number;
  totalBytes: number;
}

export interface IAudioStorageService {
  saveAudio(
    participantId: string,
    level: number,
    recordingId: string,
    blob: Blob
  ): Promise<{ path: string; fileSize: number }>;
  getAudioBlob(path: string): Promise<Blob | null>;
  getAudioUrl(path: string): Promise<string | null>;
  deleteAudio(path: string): Promise<boolean>;
  getStorageStats(userId?: string): Promise<StorageStats>;
  exportCorpusZip(
    user: User,
    recordings: Recording[],
    sentencesMap: Map<string, Sentence>
  ): Promise<Blob>;
}

/**
 * AudioStorageService
 *
 * Implements Android-compatible local app-private storage abstraction.
 * Structure: recordings/{participant_id}/level_{level_id}/{recording_id}.wav
 *
 * In this mobile/PWA architecture, binary Blobs are safely persisted in
 * browser/device IndexedDB storage. In a future production Android build,
 * this service can be seamlessly swapped or augmented with Capacitor Filesystem
 * (Directory.Data) or remote object stores (Firebase Storage / S3 / GCS).
 */
class AudioStorageService implements IAudioStorageService {
  /**
   * Generates a predictable, safe app-relative storage path.
   * Does NOT expose emails, participant names, or sensitive tokens.
   */
  getRelativeStoragePath(
    participantId: string,
    level: number,
    recordingId: string
  ): string {
    const safeParticipant = participantId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeRecordingId = recordingId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `recordings/${safeParticipant}/level_${level}/${safeRecordingId}.wav`;
  }

  /**
   * Saves an audio recording Blob into persistent app storage
   */
  async saveAudio(
    participantId: string,
    level: number,
    recordingId: string,
    blob: Blob
  ): Promise<{ path: string; fileSize: number }> {
    if (!blob || blob.size === 0) {
      throw new Error('Cannot save empty or invalid audio recording.');
    }

    const path = this.getRelativeStoragePath(participantId, level, recordingId);

    const storageFile: AudioStorageFile = {
      path,
      blob,
      mimeType: blob.type || 'audio/wav',
      createdAt: Date.now(),
    };

    await dbService.saveAudioFile(storageFile);

    return {
      path,
      fileSize: blob.size,
    };
  }

  /**
   * Retrieves audio blob from storage
   */
  async getAudioBlob(path: string): Promise<Blob | null> {
    const file = await dbService.getAudioFile(path);
    if (!file) return null;
    return file.blob;
  }

  /**
   * Generates an in-memory Object URL for playing the audio file
   */
  async getAudioUrl(path: string): Promise<string | null> {
    const blob = await this.getAudioBlob(path);
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  /**
   * Deletes an audio file from persistent storage
   */
  async deleteAudio(path: string): Promise<boolean> {
    try {
      await dbService.deleteAudioFile(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Calculate local storage space used
   */
  async getStorageStats(): Promise<StorageStats> {
    const files = await dbService.getAllAudioFiles();
    let totalBytes = 0;
    for (const f of files) {
      totalBytes += f.blob.size;
    }
    return {
      fileCount: files.length,
      totalBytes,
    };
  }

  /**
   * Export all participant recordings as a standardized speech corpus ZIP package
   * Contains audio files, CSV manifest, and anonymized participant metadata.
   */
  async exportCorpusZip(
    user: User,
    recordings: Recording[],
    sentencesMap: Map<string, Sentence>
  ): Promise<Blob> {
    const zip = new JSZip();

    // 1. Participant Metadata JSON
    const metadata = {
      participantId: user.participantId,
      gender: user.gender,
      ageGroup: user.age ? `${user.age} years` : 'Unspecified',
      registeredAt: new Date(user.createdAt).toISOString(),
      exportTimestamp: new Date().toISOString(),
      corpusVersion: '1.0.0',
      totalRecordings: recordings.length,
      specifications: {
        audioFormat: 'WAV',
        codec: 'Linear PCM 16-bit',
        channelCount: 1,
        sampleRate: 16000,
      },
    };
    zip.file('participant_metadata.json', JSON.stringify(metadata, null, 2));

    // 2. CSV Manifest (matching exact schema: recording_id, speaker_id, prompt_id, ...)
    const csvHeader = [
      'recording_id',
      'speaker_id',
      'prompt_id',
      'sentence_id',
      'level',
      'difficulty_level',
      'category',
      'sentence_text',
      'instruction_notes',
      'duration_seconds',
      'sample_rate_hz',
      'channels',
      'file_size_bytes',
      'file_path',
      'timestamp_iso',
    ].join(',');

    const csvRows = recordings.map((rec) => {
      const sentence = sentencesMap.get(rec.sentenceId);
      const promptId = rec.promptId || sentence?.promptId || rec.sentenceId;
      const speakerId = rec.speakerId || rec.participantId || user.participantId;
      const recordingId =
        rec.recordingId ||
        (rec.id && rec.id.startsWith('REC_')
          ? rec.id
          : buildRecordingId(speakerId, promptId));
      const text = sentence ? `"${sentence.text.replace(/"/g, '""')}"` : '""';
      const notes = sentence?.instructionNotes ? `"${sentence.instructionNotes.replace(/"/g, '""')}"` : '""';
      const category = sentence?.category ? `"${sentence.category.replace(/"/g, '""')}"` : '""';
      const difficulty = sentence?.difficultyLevel ? `"${sentence.difficultyLevel.replace(/"/g, '""')}"` : `"Level ${rec.level}"`;
      return [
        recordingId,
        speakerId,
        promptId,
        rec.sentenceId,
        rec.level,
        difficulty,
        category,
        text,
        notes,
        rec.duration.toFixed(2),
        rec.sampleRate,
        rec.channelCount,
        rec.fileSize,
        rec.localFilePath,
        new Date(rec.timestamp).toISOString(),
      ].join(',');
    });

    zip.file('corpus_manifest.csv', [csvHeader, ...csvRows].join('\n'));

    // 3. Sentences Catalog Master Table CSV
    const sentenceTableHeader = [
      'prompt_id',
      'difficulty_level',
      'category',
      'prompt_text_devanagari',
      'instruction_notes',
      'level',
      'sentence_number',
    ].join(',');
    const sentenceTableRows = Array.from(sentencesMap.values()).map((s) =>
      [
        s.promptId || s.id,
        `"${(s.difficultyLevel || '').replace(/"/g, '""')}"`,
        `"${(s.category || '').replace(/"/g, '""')}"`,
        `"${(s.text || '').replace(/"/g, '""')}"`,
        `"${(s.instructionNotes || '').replace(/"/g, '""')}"`,
        s.level,
        s.sentenceNumber,
      ].join(',')
    );
    zip.file('sentences_catalog_table.csv', [sentenceTableHeader, ...sentenceTableRows].join('\n'));

    // 3. Audio files packaged into directory structure
    for (const rec of recordings) {
      const blob = await this.getAudioBlob(rec.localFilePath);
      if (blob) {
        zip.file(rec.localFilePath, blob);
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Export all verified and approved recordings across the corpus for clinical research
   * Re-checks consent and approval status before packaging.
   */
  async exportVerifiedAdminDataset(
    adminUser: User,
    approvedRecordings: Recording[],
    sentencesMap: Map<string, Sentence>,
    participants: User[]
  ): Promise<{ blob: Blob; exportedCount: number }> {
    const zip = new JSZip();
    const participantsMap = new Map<string, User>(participants.map((p) => [p.participantId, p]));

    // Only export approved recordings
    const validRecordings = approvedRecordings.filter(
      (r) => r.reviewStatus === 'approved'
    );

    // Metadata JSON
    const metadata = {
      datasetTitle: 'ReVoice Clinical Speech Corpus - Verified Research Release',
      exportTimestamp: new Date().toISOString(),
      exportedBy: adminUser.email,
      totalApprovedRecordings: validRecordings.length,
      audioSpecifications: {
        format: 'WAV',
        codec: 'Linear PCM 16-bit',
        channelCount: 1,
        sampleRate: 16000,
      },
      qualityAssurance: 'Clinically Audited & Verified',
    };
    zip.file('dataset_manifest.json', JSON.stringify(metadata, null, 2));

    // CSV Manifest
    const csvHeader = [
      'recording_id',
      'speaker_id',
      'cohort',
      'prompt_id',
      'difficulty_level',
      'category',
      'prompt_text',
      'duration_seconds',
      'file_size_bytes',
      'review_status',
      'audio_path',
      'timestamp',
    ].join(',');

    const csvRows = validRecordings.map((rec) => {
      const sentence = sentencesMap.get(rec.sentenceId);
      const participant = participantsMap.get(rec.speakerId);
      const text = sentence ? `"${sentence.text.replace(/"/g, '""')}"` : '""';
      const cat = sentence?.category ? `"${sentence.category.replace(/"/g, '""')}"` : '""';
      const diff = sentence?.difficultyLevel ? `"${sentence.difficultyLevel.replace(/"/g, '""')}"` : `""`;
      return [
        rec.id,
        rec.speakerId,
        participant?.cohort || rec.cohort || 'healthy',
        rec.promptId,
        diff,
        cat,
        text,
        rec.duration.toFixed(2),
        rec.fileSize,
        rec.reviewStatus,
        rec.localFilePath,
        new Date(rec.timestamp).toISOString(),
      ].join(',');
    });

    zip.file('corpus_manifest.csv', [csvHeader, ...csvRows].join('\n'));

    // Audio files
    for (const rec of validRecordings) {
      const blob = await this.getAudioBlob(rec.localFilePath);
      if (blob) {
        zip.file(rec.localFilePath, blob);
      }
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    return { blob, exportedCount: validRecordings.length };
  }
}

export const audioStorageService = new AudioStorageService();

import { create } from 'zustand';
import { db } from '../db/schema';

// 备注类型
export type NoteType = 'text' | 'voice';

// 备注数据结构
export interface Note {
  id: string;
  goalId: string;           // 关联的目标ID
  content: string;          // 内容（文字或语音转文字）
  type: NoteType;           // 类型：文字/语音
  voiceUrl?: string;        // 语音文件URL（语音类型时）
  duration?: number;        // 语音时长（秒）
  createdAt: number;        // 创建时间
  updatedAt: number;        // 更新时间
}

interface NoteState {
  notes: Note[];
  isLoading: boolean;

  // Actions
  loadNotes: () => Promise<void>;
  getNotesByGoalId: (goalId: string) => Note[];
  getLatestNoteByGoalId: (goalId: string) => Note | null;
  addNote: (goalId: string, content: string, type?: NoteType) => Promise<Note>;
  updateNote: (noteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  deleteNotesByGoalId: (goalId: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  isLoading: false,

  // 从数据库加载所有备注
  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await db.notes?.toArray() || [];
      set({ notes, isLoading: false });
      console.log('[NoteStore] Loaded notes:', notes.length);
    } catch (error) {
      console.error('[NoteStore] Failed to load notes:', error);
      set({ isLoading: false });
    }
  },

  // 根据 goalId 获取备注列表（按时间升序 - 旧的在前，新的在后）
  getNotesByGoalId: (goalId: string) => {
    return get()
      .notes
      .filter(n => n.goalId === goalId)
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  // 获取目标下最新的一条备注（时间戳最大的）
  getLatestNoteByGoalId: (goalId: string) => {
    const notes = get().notes.filter(n => n.goalId === goalId);
    if (notes.length === 0) return null;
    // 按时间倒序，取第一个（最新的）
    return notes.sort((a, b) => b.createdAt - a.createdAt)[0];
  },

  // 添加新备注
  addNote: async (goalId: string, content: string, type: NoteType = 'text') => {
    const now = Date.now();
    const newNote: Note = {
      id: crypto.randomUUID(),
      goalId,
      content,
      type,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.notes?.add(newNote);
      set((state) => ({
        notes: [newNote, ...state.notes],
      }));
      console.log('[NoteStore] Added note:', newNote.id);
      return newNote;
    } catch (error) {
      console.error('[NoteStore] Failed to add note:', error);
      throw error;
    }
  },

  // 更新备注内容
  updateNote: async (noteId: string, content: string) => {
    const now = Date.now();
    try {
      await db.notes?.update(noteId, { content, updatedAt: now });
      set((state) => ({
        notes: state.notes.map(n =>
          n.id === noteId ? { ...n, content, updatedAt: now } : n
        ),
      }));
      console.log('[NoteStore] Updated note:', noteId);
    } catch (error) {
      console.error('[NoteStore] Failed to update note:', error);
      throw error;
    }
  },

  // 删除单条备注
  deleteNote: async (noteId: string) => {
    try {
      await db.notes?.delete(noteId);
      set((state) => ({
        notes: state.notes.filter(n => n.id !== noteId),
      }));
      console.log('[NoteStore] Deleted note:', noteId);
    } catch (error) {
      console.error('[NoteStore] Failed to delete note:', error);
      throw error;
    }
  },

  // 删除目标下的所有备注
  deleteNotesByGoalId: async (goalId: string) => {
    try {
      const notesToDelete = get().notes.filter(n => n.goalId === goalId);
      await db.transaction('rw', db.notes, async () => {
        for (const note of notesToDelete) {
          await db.notes?.delete(note.id);
        }
      });
      set((state) => ({
        notes: state.notes.filter(n => n.goalId !== goalId),
      }));
      console.log('[NoteStore] Deleted notes for goal:', goalId, 'Count:', notesToDelete.length);
    } catch (error) {
      console.error('[NoteStore] Failed to delete notes by goalId:', error);
      throw error;
    }
  },
}));

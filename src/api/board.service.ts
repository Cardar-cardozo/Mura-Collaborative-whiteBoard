import { apiClient } from './client';

export interface Board {
  _id: string;
  name: string;
  leaderName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Snapshot {
  _id: string;
  boardId: string;
  elements: any[];
  description: string;
  createdAt: string;
}

export const boardService = {
  async createBoard(name: string, leaderName: string): Promise<Board> {
    const response = await apiClient.post<Board>('/boards', { name, leaderName });
    return response.data;
  },

  async getBoards(): Promise<Board[]> {
    const response = await apiClient.get<Board[]>('/boards');
    return response.data;
  },

  async getBoardById(id: string): Promise<Board> {
    const response = await apiClient.get<Board>(`/boards/${id}`);
    return response.data;
  },

  async createSnapshot(boardId: string, description: string): Promise<Snapshot> {
    const response = await apiClient.post<Snapshot>(`/boards/${boardId}/snapshot`, { description });
    return response.data;
  },

  async getSnapshots(boardId: string): Promise<Snapshot[]> {
    const response = await apiClient.get<Snapshot[]>(`/boards/${boardId}/snapshots`);
    return response.data;
  },

  async revertToSnapshot(snapshotId: string): Promise<any> {
    const response = await apiClient.post(`/boards/revert/${snapshotId}`);
    return response.data;
  },
};

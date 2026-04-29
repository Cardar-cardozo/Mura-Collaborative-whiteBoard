import { apiClient } from './client';

export interface Element {
  _id?: string;
  boardId: string;
  elementType: 'note' | 'stroke';
  data: any;
  author?: string;
  createdAt?: string;
}

export const elementService = {
  async getElementsByBoardId(boardId: string): Promise<Element[]> {
    const response = await apiClient.get<Element[]>(`/elements/${boardId}`);
    return response.data;
  },

  async bulkCreateElements(elements: Element[]): Promise<Element[]> {
    const response = await apiClient.post<Element[]>('/elements', elements);
    return response.data;
  },

  async deleteElements(boardId: string, elementIds: string[]): Promise<any> {
    const response = await apiClient.post(`/elements/${boardId}/delete-bulk`, { elementIds });
    return response.data;
  },
};

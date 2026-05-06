import { useQuery, useMutation } from '@tanstack/react-query';
import { elementService, Element } from '../../api/element.service';
import { boardService } from '../../api/board.service';
import { Note, Stroke, BoardImage as BoardImageType } from '../../core/types';

interface BoardData {
  board: { _id: string; name: string; leaderName: string };
  elements: {
    notes: Note[];
    strokes: Stroke[];
    images: BoardImageType[];
  };
}

export function useBoardData(boardId: string) {
  return useQuery<BoardData>({
    queryKey: ['boardData', boardId],
    queryFn: async () => {
      const [board, elements] = await Promise.all([
        boardService.getBoardById(boardId),
        elementService.getElementsByBoardId(boardId),
      ]);

      return {
        board,
        elements: {
          notes: elements.filter((e) => e.elementType === 'note').map((e) => e.data as Note),
          strokes: elements.filter((e) => e.elementType === 'stroke').map((e) => e.data as Stroke),
          images: elements.filter((e) => e.elementType === 'image').map((e) => e.data as BoardImageType),
        },
      };
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useCreateElement() {
  return useMutation({
    mutationFn: async (element: Element) => {
      return elementService.bulkCreateElements([element]);
    },
  });
}

export function useUpdateElement() {
  return useMutation({
    mutationFn: async (element: Element) => {
      return elementService.bulkCreateElements([element]);
    },
  });
}

export function useDeleteElement() {
  return useMutation({
    mutationFn: async ({ boardId, id }: { boardId: string; id: string }) => {
      return elementService.deleteElements(boardId, [id]);
    },
  });
}

export function useDeleteElements() {
  return useMutation({
    mutationFn: async ({ boardId, ids }: { boardId: string; ids: string[] }) => {
      return elementService.deleteElements(boardId, ids);
    },
  });
}

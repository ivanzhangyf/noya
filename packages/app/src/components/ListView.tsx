import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from '@dnd-kit/modifiers';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Children,
  createContext,
  isValidElement,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import styled, { CSSObject } from 'styled-components';
import { useHover } from '../hooks/useHover';

export type ListRowPosition = 'only' | 'first' | 'middle' | 'last';

const listReset: CSSObject = {
  marginTop: 0,
  marginRight: 0,
  marginBottom: 0,
  marginLeft: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  textIndent: 0,
  listStyleType: 'none',
};

type ListRowContextValue = {
  position: ListRowPosition;
  selectedPosition: ListRowPosition;
  sortable: boolean;
};

const ListRowContext = createContext<ListRowContextValue>({
  position: 'only',
  selectedPosition: 'only',
  sortable: false,
});

/* ----------------------------------------------------------------------------
 * RowTitle
 * ------------------------------------------------------------------------- */

const ListViewRowTitle = styled.span(({ theme }) => ({
  flex: '1 1 0',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'pre',
}));

/* ----------------------------------------------------------------------------
 * Row
 * ------------------------------------------------------------------------- */

const RowContainer = styled.li<{
  position: ListRowPosition;
  selected: boolean;
  selectedPosition: ListRowPosition;
}>(({ theme, position, selected, selectedPosition }) => ({
  ...listReset,
  ...theme.textStyles.small,
  flex: '0 0 auto',
  userSelect: 'none',
  cursor: 'pointer',
  borderTopRightRadius: '4px',
  borderTopLeftRadius: '4px',
  borderBottomRightRadius: '4px',
  borderBottomLeftRadius: '4px',
  paddingTop: '6px',
  paddingRight: '12px',
  paddingBottom: '6px',
  paddingLeft: '12px',
  marginLeft: '8px',
  marginRight: '8px',
  ...(selected && {
    color: 'white',
    backgroundColor: theme.colors.primary,
  }),
  display: 'flex',
  alignItems: 'center',
  ...((position === 'first' || position === 'only') && {
    marginTop: '8px',
  }),
  ...((position === 'last' || position === 'only') && {
    marginBottom: '8px',
  }),
  ...(selected &&
    (selectedPosition === 'middle' || selectedPosition === 'last') && {
      borderTopRightRadius: '0px',
      borderTopLeftRadius: '0px',
    }),
  ...(selected &&
    (selectedPosition === 'middle' || selectedPosition === 'first') && {
      borderBottomRightRadius: '0px',
      borderBottomLeftRadius: '0px',
    }),
}));

export interface ListViewClickInfo {
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
}

export interface ListViewRowProps {
  id?: string;
  selected?: boolean;
  sortable?: boolean;
  onClick?: (info: ListViewClickInfo) => void;
  onHoverChange?: (isHovering: boolean) => void;
  children?: ReactNode;
}

function SortableItem({
  active,
  id,
  children,
}: {
  active: boolean;
  id: string;
  children: (props: any) => JSX.Element;
}) {
  const sortable = useSortable({ id });

  const { attributes, listeners, setNodeRef, transform, transition } = sortable;

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  return children({ ref: setNodeRef, style, ...attributes, ...listeners });
}

function ListViewRow({
  id,
  selected = false,
  onClick,
  onHoverChange,
  children,
}: ListViewRowProps) {
  const { position, selectedPosition, sortable } = useContext(ListRowContext);
  const { hoverProps } = useHover({
    onHoverChange,
  });

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      onClick?.(event);
    },
    [onClick],
  );

  const props: React.ComponentProps<typeof RowContainer> = {
    id: id,
    ...hoverProps,
    onClick: handleClick,
    position: position,
    selected: selected,
    selectedPosition: selectedPosition,
    'aria-selected': selected,
    children,
  };

  if (sortable && id) {
    return (
      <SortableItem id={id} active={false}>
        {(sortableProps) => <RowContainer {...props} {...sortableProps} />}
      </SortableItem>
    );
  }

  return <RowContainer {...props} />;
}

/* ----------------------------------------------------------------------------
 * SectionHeader
 * ------------------------------------------------------------------------- */

const SectionHeaderContainer = styled.li<{ selected: boolean }>(
  ({ theme, selected }) => ({
    ...listReset,
    ...theme.textStyles.small,
    flex: '0 0 auto',
    userSelect: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    paddingTop: '6px',
    paddingRight: '20px',
    paddingBottom: '6px',
    paddingLeft: '20px',
    borderBottom: `1px solid ${
      selected ? theme.colors.primaryDark : theme.colors.divider
    }`,
    backgroundColor: theme.colors.listView.raisedBackground,
    ...(selected && {
      color: 'white',
      backgroundColor: theme.colors.primary,
    }),
    display: 'flex',
    alignItems: 'center',
  }),
);

function ListViewSectionHeader({
  children,
  onClick,
  onHoverChange,
  selected = false,
}: ListViewRowProps) {
  const { hoverProps } = useHover({
    onHoverChange,
  });

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      onClick?.(event);
    },
    [onClick],
  );

  return (
    <SectionHeaderContainer
      {...hoverProps}
      onClick={handleClick}
      selected={selected}
      aria-selected={selected}
    >
      {children}
    </SectionHeaderContainer>
  );
}

/* ----------------------------------------------------------------------------
 * Root
 * ------------------------------------------------------------------------- */

const RootContainer = styled.ul(({ theme }) => ({
  ...listReset,
  flex: '1 0 0',
  display: 'flex',
  flexDirection: 'column',
  flexWrap: 'nowrap',
  color: theme.colors.textMuted,
  overflowY: 'auto',
}));

interface ListViewRootProps {
  children?: ReactNode;
  onClick?: () => void;
  sortable?: boolean;
  onMoveItem?: (sourceIndex: number, destinationIndex: number) => void;
}

const isSectionHeader = (type: any): string | undefined => {
  try {
    return type.isSectionHeader;
  } catch {
    return undefined;
  }
};

function SortableContainer({
  keys,
  children,
  onMoveItem,
}: {
  keys: string[];
  children: ReactNode;
  onMoveItem?: (sourceIndex: number, destinationIndex: number) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [activeId, setActiveId] = useState<string | null>(null);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    setActiveId(active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = keys.indexOf(active.id);
      const newIndex = keys.indexOf(over.id);

      onMoveItem?.(oldIndex, newIndex);
    }

    setActiveId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
    >
      <SortableContext items={keys} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

function ListViewRoot({
  onClick,
  children,
  sortable = false,
  onMoveItem,
}: ListViewRootProps) {
  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();

      onClick?.();
    },
    [onClick],
  );

  const flattened = Children.toArray(children);

  const ids: string[] = flattened.flatMap((current) =>
    isValidElement(current) && typeof current.props.id === 'string'
      ? [current.props.id]
      : [],
  );

  const mappedChildren = flattened.map((current, i) => {
    if (!isValidElement(current)) return current;

    const prev = flattened[i - 1];
    const next = flattened[i + 1];

    const nextItem =
      isValidElement(next) && !isSectionHeader(next.type) ? next : undefined;
    const prevItem =
      isValidElement(prev) && !isSectionHeader(prev.type) ? prev : undefined;

    let position: ListRowPosition = 'only';
    let selectedPosition: ListRowPosition = 'only';

    if (nextItem && prevItem) {
      position = 'middle';
    } else if (nextItem && !prevItem) {
      position = 'first';
    } else if (!nextItem && prevItem) {
      position = 'last';
    }

    if (current.props.selected) {
      const nextSelected = nextItem && nextItem.props.selected;
      const prevSelected = prevItem && prevItem.props.selected;

      if (nextSelected && prevSelected) {
        selectedPosition = 'middle';
      } else if (nextSelected && !prevSelected) {
        selectedPosition = 'first';
      } else if (!nextSelected && prevSelected) {
        selectedPosition = 'last';
      }
    }

    const contextValue = {
      position,
      selectedPosition,
      sortable,
    };

    return (
      <ListRowContext.Provider key={current.key} value={contextValue}>
        {current}
      </ListRowContext.Provider>
    );
  });

  if (sortable && ids.length !== mappedChildren.length) {
    throw new Error(
      'Bad ListView props: each row element needs an id to be sortable',
    );
  }

  const sortableChildren = sortable ? (
    <SortableContainer onMoveItem={onMoveItem} keys={ids}>
      {mappedChildren}
    </SortableContainer>
  ) : (
    mappedChildren
  );

  return (
    <RootContainer onClick={handleClick}>{sortableChildren}</RootContainer>
  );
}

export const RowTitle = memo(ListViewRowTitle);
export const Row = memo(ListViewRow);
export const SectionHeader = memo(ListViewSectionHeader);
(SectionHeader as any).isSectionHeader = true;
export const Root = memo(ListViewRoot);

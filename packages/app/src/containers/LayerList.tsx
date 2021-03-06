import {
  BoxModelIcon,
  CircleIcon,
  GroupIcon,
  ImageIcon,
  SquareIcon,
  TextIcon,
} from '@radix-ui/react-icons';
import Sketch from '@sketch-hq/sketch-file-format-ts';
import { Layers, PageLayer, Selectors } from 'noya-state';
import { memo, useCallback, useMemo } from 'react';
import { visit } from 'tree-visit';
import * as TreeView from '../components/TreeView';
import {
  useApplicationState,
  useSelector,
} from '../contexts/ApplicationStateContext';
import useDeepArray from '../hooks/useDeepArray';
import useShallowArray from '../hooks/useShallowArray';

type LayerType = PageLayer['_class'];

type LayerListItem = {
  type: LayerType;
  id: string;
  name: string;
  depth: number;
  expanded: boolean;
  selected: boolean;
};

function flattenLayerList(
  page: Sketch.Page,
  selectedObjects: string[],
): LayerListItem[] {
  const flattened: LayerListItem[] = [];

  visit<PageLayer | Sketch.Page>(page, {
    getChildren: (layer) => {
      if (layer.layerListExpandedType === Sketch.LayerListExpanded.Collapsed) {
        return [];
      }

      return Layers.getChildren(layer).slice().reverse();
    },
    onEnter(layer, indexPath) {
      if (layer._class === 'page') return;

      flattened.push({
        type: layer._class,
        id: layer.do_objectID,
        name: layer.name,
        depth: indexPath.length - 1,
        expanded:
          layer.layerListExpandedType === Sketch.LayerListExpanded.Expanded,
        selected: selectedObjects.includes(layer.do_objectID),
      });
    },
  });

  return flattened;
}

const LayerIcon = memo(function LayerIcon({
  type,
  selected,
}: {
  type: LayerType;
  selected: boolean;
}) {
  const color = selected ? 'rgb(220, 220, 220)' : 'rgb(139, 139, 139)';

  switch (type) {
    case 'rectangle':
      return <SquareIcon color={color} />;
    case 'oval':
      return <CircleIcon color={color} />;
    case 'text':
      return <TextIcon color={color} />;
    case 'artboard':
      return <BoxModelIcon color={color} />;
    case 'group':
      return <GroupIcon color={color} />;
    case 'bitmap':
      return <ImageIcon color={color} />;
    default:
      return null;
  }
});

export default memo(function LayerList() {
  const [state, dispatch] = useApplicationState();
  const page = useSelector(Selectors.getCurrentPage);
  const selectedObjects = useShallowArray(state.selectedObjects);
  const items = useDeepArray(flattenLayerList(page, selectedObjects));

  const layerElements = useMemo(() => {
    return items.map(({ id, name, depth, type, expanded, selected }, index) => {
      const handleClick = (info: TreeView.TreeViewClickInfo) => {
        const { metaKey, shiftKey } = info;

        dispatch('interaction', ['reset']);

        if (metaKey) {
          dispatch(
            'selectLayer',
            id,
            selectedObjects.includes(id) ? 'difference' : 'intersection',
          );
        } else if (shiftKey && selectedObjects.length > 0) {
          const lastSelectedIndex = items.findIndex(
            (item) => item.id === selectedObjects[selectedObjects.length - 1],
          );

          const first = Math.min(index, lastSelectedIndex);
          const last = Math.max(index, lastSelectedIndex) + 1;

          dispatch(
            'selectLayer',
            items.slice(first, last).map((item) => item.id),
            'intersection',
          );
        } else {
          dispatch('selectLayer', id, 'replace');
        }
      };

      const handleHoverChange = (hovered: boolean) => {
        dispatch(
          'highlightLayer',
          hovered ? { id, precedence: 'aboveSelection' } : undefined,
        );
      };

      const handleClickChevron = () =>
        dispatch('setExpandedInLayerList', id, !expanded);

      const Component =
        type === 'artboard' ? TreeView.SectionHeader : TreeView.Row;

      return (
        <Component
          key={id}
          depth={depth}
          selected={selected}
          onClick={handleClick}
          onHoverChange={handleHoverChange}
          icon={<LayerIcon type={type} selected={selected} />}
          expanded={
            type === 'artboard' || type === 'group' ? expanded : undefined
          }
          onClickChevron={handleClickChevron}
        >
          <TreeView.RowTitle>{name}</TreeView.RowTitle>
        </Component>
      );
    });
  }, [items, dispatch, selectedObjects]);

  return (
    <TreeView.Root
      onClick={useCallback(() => dispatch('selectLayer', undefined), [
        dispatch,
      ])}
    >
      {layerElements}
    </TreeView.Root>
  );
});

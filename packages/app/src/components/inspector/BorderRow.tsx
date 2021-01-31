import type FileFormat from '@sketch-hq/sketch-file-format-ts';
// import EditableInput from '../components/input/EditableInput';
import styled from 'styled-components';
import * as InputField from '../InputField';
import * as Spacer from '../Spacer';
import { DimensionValue } from './DimensionsInspector';

const Row = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
}));

interface Props {
  color: FileFormat.Color;
  width: DimensionValue;
}

export default function BorderRow({ color, width }: Props) {
  return (
    <Row>
      <div
        style={{
          width: '60px',
          height: '19px',
          backgroundColor: `rgba(${color.red * 255}, ${color.green * 255}, ${
            color.blue * 255
          }, ${color.alpha})`,
        }}
      />
      <Spacer.Horizontal size={8} />
      <InputField.Root>
        <InputField.Input value={String(width)} />
        {/* <InputField.Label>Width</InputField.Label> */}
      </InputField.Root>
    </Row>
  );
}
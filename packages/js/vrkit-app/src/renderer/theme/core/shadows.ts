import type { Shadows } from '@mui/material/styles';

import { appAlpha } from '../styles';
import { grey, common } from './palette';

import type { ThemeColorScheme } from '../ThemeTypes';

// ----------------------------------------------------------------------

export function shadows(colorScheme: ThemeColorScheme, inset:boolean = false): Shadows {
  const colorChannel = colorScheme === 'light' ? grey['500'] : common.blackChannel;

  const color1 = appAlpha(colorChannel, 0.17);
  const color2 = appAlpha(colorChannel, 0.1);
  const color3 = appAlpha(colorChannel, 0.08);
  const prefix = inset ? "inset " : ""
  return [
    'none',
    `${prefix}0px 2px 1px -1px ${color1},${prefix}0px 1px 1px 0px ${color2},${prefix}0px 1px 3px 0px ${color3}`,
    `${prefix}0px 3px 1px -2px ${color1},${prefix}0px 2px 2px 0px ${color2},${prefix}0px 1px 5px 0px ${color3}`,
    `${prefix}0px 3px 3px -2px ${color1},${prefix}0px 3px 4px 0px ${color2},${prefix}0px 1px 8px 0px ${color3}`,
    `${prefix}0px 2px 4px -1px ${color1},${prefix}0px 4px 5px 0px ${color2},${prefix}0px 1px 10px 0px ${color3}`,
    `${prefix}0px 3px 5px -1px ${color1},${prefix}0px 5px 8px 0px ${color2},${prefix}0px 1px 14px 0px ${color3}`,
    `${prefix}0px 3px 5px -1px ${color1},${prefix}0px 6px 10px 0px ${color2},${prefix}0px 1px 18px 0px ${color3}`,
    `${prefix}0px 4px 5px -2px ${color1},${prefix}0px 7px 10px 1px ${color2},${prefix}0px 2px 16px 1px ${color3}`,
    `${prefix}0px 5px 5px -3px ${color1},${prefix}0px 8px 10px 1px ${color2},${prefix}0px 3px 14px 2px ${color3}`,
    `${prefix}0px 5px 6px -3px ${color1},${prefix}0px 9px 12px 1px ${color2},${prefix}0px 3px 16px 2px ${color3}`,
    `${prefix}0px 6px 6px -3px ${color1},${prefix}0px 10px 14px 1px ${color2},${prefix}0px 4px 18px 3px ${color3}`,
    `${prefix}0px 6px 7px -4px ${color1},${prefix}0px 11px 15px 1px ${color2},${prefix}0px 4px 20px 3px ${color3}`,
    `${prefix}0px 7px 8px -4px ${color1},${prefix}0px 12px 17px 2px ${color2},${prefix}0px 5px 22px 4px ${color3}`,
    `${prefix}0px 7px 8px -4px ${color1},${prefix}0px 13px 19px 2px ${color2},${prefix}0px 5px 24px 4px ${color3}`,
    `${prefix}0px 7px 9px -4px ${color1},${prefix}0px 14px 21px 2px ${color2},${prefix}0px 5px 26px 4px ${color3}`,
    `${prefix}0px 8px 9px -5px ${color1},${prefix}0px 15px 22px 2px ${color2},${prefix}0px 6px 28px 5px ${color3}`,
    `${prefix}0px 8px 10px -5px ${color1},${prefix}0px 16px 24px 2px ${color2},${prefix}0px 6px 30px 5px ${color3}`,
    `${prefix}0px 8px 11px -5px ${color1},${prefix}0px 17px 26px 2px ${color2},${prefix}0px 6px 32px 5px ${color3}`,
    `${prefix}0px 9px 11px -5px ${color1},${prefix}0px 18px 28px 2px ${color2},${prefix}0px 7px 34px 6px ${color3}`,
    `${prefix}0px 9px 12px -6px ${color1},${prefix}0px 19px 29px 2px ${color2},${prefix}0px 7px 36px 6px ${color3}`,
    `${prefix}0px 10px 13px -6px ${color1},${prefix}0px 20px 31px 3px ${color2},${prefix}0px 8px 38px 7px ${color3}`,
    `${prefix}0px 10px 13px -6px ${color1},${prefix}0px 21px 33px 3px ${color2},${prefix}0px 8px 40px 7px ${color3}`,
    `${prefix}0px 10px 14px -6px ${color1},${prefix}0px 22px 35px 3px ${color2},${prefix}0px 8px 42px 7px ${color3}`,
    `${prefix}0px 11px 14px -7px ${color1},${prefix}0px 23px 36px 3px ${color2},${prefix}0px 9px 44px 8px ${color3}`,
    `${prefix}0px 11px 15px -7px ${color1},${prefix}0px 24px 38px 3px ${color2},${prefix}0px 9px 46px 8px ${color3}`,
  ];
}

import {isNumber, isString} from '@ng-bootstrap/ng-bootstrap/util/util';
import {isBoolean, isUndefined} from 'util';

export const getFloat = (value: any) => {
  if (isNumber(value)) {
    return parseFloat(value.toString());
  }
  return 0;
};

export const getNumber = (value: any) => {
  if (isNumber(value)) {
    return parseInt(value.toString(), 0);
  }
  return 0;
};

export const getString = (value: any) => {
  if (isString(value)) {
    return value.toString();
  }
  return '';
};

export const getBool = (value: any) => {
  if (isBoolean(value)) {
    return value;
  }
  return false;
};

export const getBoolByInt = (value: any) => {
  if (isNumber(value)) {
    if (getNumber(value) === 0) {
      return false;
    } else {
      return true;
    }
  }
  return false;
};






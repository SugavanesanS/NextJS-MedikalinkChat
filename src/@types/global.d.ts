// src/global.d.ts
declare const moment: {
  (inp?: moment.MomentInput, format?: moment.MomentFormatSpecification, strict?: boolean): moment.Moment;
  fn: moment.Moment;
};

interface Window {
  pdfjsLib: any;
}

export { };

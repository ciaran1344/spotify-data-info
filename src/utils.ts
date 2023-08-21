import _ from "lodash";

import { NULL } from "./constants.js";
import { applyDataTemplate } from "./template.js";
import { EndsongData, EndsongDatum } from "./validators.js";

export function topCount(
  data: EndsongData,
  countBy: ((endsong: EndsongDatum) => string) | keyof EndsongDatum
): [key: string, count: number][] {
  return _.chain(data)
    .countBy(countBy)
    .omit(NULL)
    .entries()
    .value()
    .sort(([, countA], [, countB]) => countB - countA); // Sort count descending
}

export function topCountByTemplate(
  data: EndsongData,
  template: string
): [key: string, count: number][] {
  return topCount(data, (datum) => applyDataTemplate(template, datum));
}

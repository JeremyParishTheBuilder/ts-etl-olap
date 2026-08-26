import { describe, it, expect } from 'vitest';
import { json_value, source } from '../../src/ast/dsl.js';
import { bindImportExpression } from '../../src/mapping/import/bindImportExpression.js';
import { createImportContext } from '../utils/importHelpers.js';

describe("Semantic::bindImportSourceExpression", () => {
  it("binds JSON_VALUE against an import source", () => {
    const expression = json_value(
      source(),
      "$.chain_name",
    );

    const bound = bindImportExpression(expression);

    expect(
      bound.evaluate(createImportContext({
        chain_name: "osmosis",
      })),
    ).toBe("osmosis");
  });
});
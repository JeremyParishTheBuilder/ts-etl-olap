import { TabularExpressionNode } from "./TabularExpressionNode.js";

export class TableReferenceNode extends TabularExpressionNode {
  readonly kind = "table";

  constructor(public readonly name: string) {
    super();
  }
}

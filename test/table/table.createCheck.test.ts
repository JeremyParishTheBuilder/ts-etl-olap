import { describe, it, expect } from 'vitest';
import { buildTable, createCheckTestSpec, createColumnTestSpec } from '../utils/buildSchema.js';
import { ColumnExpressionNode } from '../../src/semantic/ast/expression/ColumnExpressionNode.js';
import { LiteralExpressionNode } from '../../src/semantic/ast/expression/LiteralExpressionNode.js';
import { ComparisonPredicateNode } from '../../src/semantic/ast/predicate/ComparisonPredicateNode.js';

describe('Table::createCheck', () => {

  it('adds a check constraint', () => {
    const table = buildTable()
      .createColumn(createColumnTestSpec({
        name: "Age",
        type: Number,
      }));


    const updated = table
      .createCheck(createCheckTestSpec({
        name: "CHK_PositiveAge",
      }));

    expect(
      updated.checks.requireByName("CHK_PositiveAge")
    ).toBeDefined();
  });

  it('does not mutate original table (immutability)', () => {
    const table = buildTable()
      .createColumn({
        name: "Age",
        type: Number,
      });

    const updated = table.createCheck(
      createCheckTestSpec({
        name: "CHK_PositiveAge",
      })
    );

    expect(() => {
      table.checks.requireByName("CHK_PositiveAge");
    }).toThrow();

    expect(
      updated.checks.requireByName("CHK_PositiveAge")
    ).toBeDefined();
  });

  it('allows referencing columns that exist', () => {
    const table = buildTable()
      .createColumn({
        name: "Age",
        type: Number,
      });

    expect(() => {
      table.createCheck(
        createCheckTestSpec({
          name: "CHK_PositiveAge",
          predicate: new ComparisonPredicateNode(
            new ColumnExpressionNode("Age"),
            "gte",
            new LiteralExpressionNode(18)
          )
        })
      );
    }).not.toThrow();
  });

  it('throws when referenced columns do not exist', () => {
    const table = buildTable();

    expect(() => {
      table.createCheck(
        createCheckTestSpec({
          name: "CHK_PositiveAge",
          predicate: new ComparisonPredicateNode(
            new ColumnExpressionNode("Age"),
            "gte",
            new LiteralExpressionNode(18)
          )
        })
      );
    }).toThrow();
  });

  it('throws when another constraint already uses the same name', () => {
    const table = buildTable()
      .createColumn({
        name: "Age",
        type: Number,
      })
      .createCheck(
        createCheckTestSpec({
          name: "CHK_PositiveAge",
        })
      );

    expect(() => {
      table.createCheck(
        createCheckTestSpec({
          name: "CHK_PositiveAge",
        })
      );
    }).toThrow();
  });

  it('supports case-insensitive referenced columns', () => {
    const table = buildTable()
      .createColumn({
        name: "Age",
        type: Number,
      });

    const updated = table.createCheck(
      createCheckTestSpec({
        name: "CHK_PositiveAge",
      })
    );

    expect(
      updated.checks.requireByName("CHK_PositiveAge")
    ).toBeDefined();
  });

  it('rejects creating a check when existing rows violate it', () => {
    const table =
      buildTable()
        .createColumn({
          name: "Age",
          type: Number,
        })
        .addRow([10]);

    expect(() => {
      table.createCheck(
        createCheckTestSpec({
          name: "CHK_Adult",
          predicate: new ComparisonPredicateNode(
            new ColumnExpressionNode("Age"),
            "gte",
            new LiteralExpressionNode(18),
          ),
        })
      );
    }).toThrow();
  });

  it('allows creating a check when existing rows satisfy it', () => {
    const table =
      buildTable()
        .createColumn({
          name: "Age",
          type: Number,
        })
        .addRow([20]);

    expect(() => {
      table.createCheck(
        createCheckTestSpec({
          name: "CHK_Adult",
          predicate: new ComparisonPredicateNode(
            new ColumnExpressionNode("Age"),
            "gte",
            new LiteralExpressionNode(18),
          ),
        })
      );
    }).not.toThrow();
  });
});
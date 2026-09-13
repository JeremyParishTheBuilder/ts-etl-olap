import { describe, it, expect } from 'vitest';
import { SQL_DECIMAL, SQL_INTEGER, SQL_VARCHAR } from '../../src/types/SqlType.ts';
import { reconcileQueryColumns } from '../../src/semantic/reconcileQueryColumns.ts';
import type { QueryColumn } from '../../src/evaluation/plan/QueryPlan.ts';

describe('SemanticAnalyzer::bindQuery', () => {
  describe("query column reconciliation", () => {
    it("uses the left query column names", () => {
      const left: QueryColumn[] = [
        {
          name: "Id",
          type: SQL_DECIMAL,
          nullable: false,
        },
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        },
      ];

      const right: QueryColumn[] = [
        {
          name: "UserId",
          type: SQL_DECIMAL,
          nullable: false,
        },
        {
          name: "DisplayName",
          type: SQL_VARCHAR,
          nullable: false,
        },
      ];

      expect(reconcileQueryColumns(left, right)).toEqual([
        {
          name: "Id",
          type: SQL_DECIMAL,
          nullable: false,
        },
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        },
      ]);
    });

    it("combines corresponding column types using the common SQL type", () => {
      const left: QueryColumn[] = [
        {
          name: "Value",
          type: SQL_DECIMAL,
          nullable: false,
        },
      ];

      const right: QueryColumn[] = [
        {
          name: "Amount",
          type: SQL_INTEGER,
          nullable: false,
        },
      ];

      expect(reconcileQueryColumns(left, right)).toEqual([
        {
          name: "Value",
          type: SQL_DECIMAL,
          nullable: false,
        },
      ]);
    });

    it("makes a column nullable when either query column is nullable", () => {
      const left: QueryColumn[] = [
        {
          name: "Id",
          type: SQL_DECIMAL,
          nullable: false,
        },
      ];

      const right: QueryColumn[] = [
        {
          name: "UserId",
          type: SQL_DECIMAL,
          nullable: true,
        },
      ];

      expect(reconcileQueryColumns(left, right)).toEqual([
        {
          name: "Id",
          type: SQL_DECIMAL,
          nullable: true,
        },
      ]);
    });

    it.each([
      [false, false, false],
      [false, true, true],
      [true, false, true],
      [true, true, true],
    ])(
      "reconciles nullability: %s + %s -> %s",
      (leftNullable, rightNullable, expectedNullable) => {
        const left: QueryColumn[] = [
          {
            name: "Id",
            type: SQL_DECIMAL,
            nullable: leftNullable,
          },
        ];

        const right: QueryColumn[] = [
          {
            name: "Id",
            type: SQL_DECIMAL,
            nullable: rightNullable,
          },
        ];

        expect(reconcileQueryColumns(left, right)).toEqual([
          {
            name: "Id",
            type: SQL_DECIMAL,
            nullable: expectedNullable,
          },
        ]);
      },
    );

    it("rejects query columns with different lengths", () => {
      const left: QueryColumn[] = [
        {
          name: "Id",
          type: SQL_DECIMAL,
          nullable: false,
        },
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        },
      ];

      const right: QueryColumn[] = [
        {
          name: "Id",
          type: SQL_DECIMAL,
          nullable: false,
        },
      ];

      expect(() => reconcileQueryColumns(left, right)).toThrow(
        "Query column lists must have the same length",
      );
    });

    it("matches columns positionally rather than by name", () => {
      const left: QueryColumn[] = [
        {
          name: "Id",
          type: SQL_DECIMAL,
          nullable: false,
        },
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        },
      ];

      const right: QueryColumn[] = [
        {
          name: "CompletelyDifferentId",
          type: SQL_DECIMAL,
          nullable: false,
        },
        {
          name: "CompletelyDifferentName",
          type: SQL_VARCHAR,
          nullable: false,
        },
      ];

      expect(reconcileQueryColumns(left, right)).toEqual([
        {
          name: "Id",
          type: SQL_DECIMAL,
          nullable: false,
        },
        {
          name: "Name",
          type: SQL_VARCHAR,
          nullable: false,
        },
      ]);
    });
  });
});
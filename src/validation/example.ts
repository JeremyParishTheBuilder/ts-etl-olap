import { literal } from "../dsl/expression/functions.js";
import { isNull } from "../dsl/predicate/functions.js";
import { EngineRegistry } from "../engine/EngineRegistry.js";
import type { PostgresInputBatch } from "../input/PostgresInputBatch.js";
import { ValidationEngine } from "./ValidationEngine.js";
import { ValidationRuleset } from "./ValidationRuleset.js";

const sql = EngineRegistry.getInstance().engine().input() as PostgresInputBatch;

const exampleChainRegistry_validationRuleset: ValidationRuleset =
  ValidationRuleset.create({
    name: "Chain Registry Test Validation",
  })
    .withRule({
      name: "ChainName Uniqueness",
      description: "Each chain_name must be unique",
      statements: [
        sql
          .alterTable("Chains")
          .addConstraint("ChainNameUnique")
          .unique(["ChainDirectory.ChainDirectoryName"])
          .asConstraintStatement(),
      ],
    })
    .withRule({
      name: "ChainName Consistency",
      description: "Chain Name must be consistent throughout associated files",
      statements: [
        sql
          .alterTable("Chains")
          .addConstraint("ChainDirectoryNameMatchesChainFile")
          .check(
            sql.and(
              sql.or(
                sql.isNotNull(
                  sql.column("ChainFile.ChainName")),
                sql
                  .column("ChainFile.ChainName")
                  .eq(sql.column("ChainDirectory.ChainDirectoryName")),
              ),
              sql.or(
                sql.isNull(
                  sql.column("AssetlistFile.ChainName")),
                sql
                  .column("AssetlistFile.ChainName")
                  .eq(sql.column("ChainDirectory.ChainDirectoryName")),
              ),
            ),
          )
          .asConstraintStatement(),
      ],
    });

// const report = ValidationEngine.validate({
//   engine: EngineRegistry.getInstance().engine(),
//   databaseName: "Test Registry",
//   ruleset: exampleChainRegistry_validationRuleset,
// });

// console.log(report);

export function runExampleValidation(
  engineName?: string,
  databaseName?: string
) {
  const report = ValidationEngine.validate({
    engine: EngineRegistry.getInstance().engine(engineName),
    databaseName: databaseName ?? "Test Registry",
    ruleset: exampleChainRegistry_validationRuleset,
  });

  console.log(
    `${report.failedRules.length} validation rules failed`,
  );

  console.log(JSON.stringify(report, null, 2));
}
import { Statement } from "../Statement.js";
import { CreateDatabaseAction } from "../../actions/CreateDatabaseAction.js";

export class CreateDatabaseStatement extends Statement<void> {
  constructor(
    private name: string
  ) {
    super();
    this.addAction(new CreateDatabaseAction(this.name));
  }
}
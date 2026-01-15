import { Statement} from "../Statement.js";
import { UseDatabaseAction } from "../../actions/UseDatabaseAction.js";

export class UseDatabaseStatement extends Statement<void> {
  constructor(
    public dbName: string
  ) {
    super();
    this.addAction(new UseDatabaseAction(dbName));
  }
}
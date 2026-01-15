import { Action } from "../actions/Action.js";

export abstract class Statement<T> {
  protected actions: Action[] = [];

  public getActions(): Action[] {
    return this.actions;
  }

  public addAction(action: Action): void {
    this.actions.push(action);
  }

  public isBegin(): boolean {
    return false;
  }

  public isCommit(): boolean {
    return false;
  }
}

export class BeginTransactionStatement extends Statement<void> {
  public isBegin(): boolean { return true; }
}

export class CommitTransactionStatement extends Statement<void> {
  public isCommit(): boolean { return true; }
}
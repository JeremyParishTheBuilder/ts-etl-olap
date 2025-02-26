class Chain {

  public chain_name: string | null = null;

  public constructor(chain_name: string) {
    this.chain_name = chain_name;
  }

  public getChainProperty(property: string): string | null {
    return "blah";
  }

}
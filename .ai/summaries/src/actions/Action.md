# Actions Directory Summary

This directory contains action classes that implement specific operations within a grid/table system. The actions follow a consistent pattern of implementing an Action interface and providing execute methods that operate on grid instances or database contexts.

# Action
An Action represents a single operation that can be applied to an EngineContext.

## Interface

```typescript
interface Action {
  apply(ctx: EngineContext): void;
}
```

## Description

The Action interface defines the contract for all actions within the system. Each action must implement the `apply` method which takes an EngineContext as a parameter and performs some operation on it. This pattern enables a flexible and extensible system where different types of actions can be executed in a uniform manner.

## Usage

Actions are typically used to represent discrete operations that modify the state of an EngineContext. They provide a consistent way to execute operations while maintaining separation of concerns and enabling composition of complex behaviors from simple actions.

## Action Classes

### AddColumnAction.ts
This action implements the functionality to add new columns to a data grid or table component. Key characteristics include:
- Extends a base Action class with identifier "addColumn" and display name "Add Column"
- Implements execute method that takes a grid instance and column configuration
- Creates new columns using a column factory and adds them to the grid's columns
- Handles both end-of-list and specific index insertion scenarios
- Designed for dynamic column addition with configurable column properties
- Reusable across different grid instances within a grid/table component system

### DropColumnAction.ts
This action implements the functionality to remove columns from database tables. Key characteristics include:
- Implements the Action interface for database column deletion operations
- Requires specific table and column name parameters for execution
- Depends on EngineContext for validation and execution context
- Delegates actual column dropping to resolver's requireTable and dropColumn methods
- Maintains action pattern structure while focusing on database operation delegation
- Enforces that operations must be performed within a valid engine context

## Common Patterns
All actions in this directory:
- Implement a standardized Action interface
- Provide execute/apply methods for operation execution
- Follow a pattern where specific operations are encapsulated in dedicated classes
- Support dynamic operations within their respective domains (grid manipulation and database operations)
- Are designed for reusability and integration into larger system components

## Purpose
The actions directory provides a structured approach to implementing domain-specific operations that can be applied to grid/table components or database systems, allowing for consistent, reusable, and maintainable operation implementations.

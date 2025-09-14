# Collect knowledge or sessions
- prompt for knowledge collection within initiative

I need to create a prompt for an MSP server that allows collecting data from a coding session when a user made manual changes or directly guided an agent with specific correction commands during initiative work.

## Data Sources for Analysis

The data sources we want to analyze include:
- Changes in Git WorkTree
- Agent communication session

## Analysis Objectives

The system must analyze and collect:
- **Decisions** made during the work
- **Solutions** implemented
- **Patterns** that emerged during the process

## Purpose

The collected information will be analyzed at initiative completion to determine what should be transferred to the project's knowledge base.

## Command Operation

The command:
- Receives an initiative parameter as input
- Operates autonomously after receiving the parameter
- Assumes the context is already loaded in the agent session
- Does not require additional session loading
- Use initiative_update tool to update decisions, solutions,patterns if it needs


---

# Project init prompt
 - collect base data

---
# Project base data validate
 - validate architecture
 - validate codebase
 - validate desitions, solutions, patterns

---

# Remove duplicates in templates


---
# Optimize context loading???
 - general (always load)
 - domen scope (semantic search)

# Project base data validate
 - validate architecture
 - validate codebase
 - validate desitions, solutions, patterns

## MCP Server Knowledge Validation and Update Prompt

Create a comprehensive prompt for an MCP server that manages the validation and updating of core project knowledge artifacts including architecture documentation, codebase documentation, and existing decisions, solutions, and patterns.

### Primary Objective

Load complete project context (architecture, codebase, decisions, solutions, patterns) and perform thorough fundamental analysis of each artifact to ensure accuracy and relevance.

### Core Requirements

**Artifact Analysis:**
- Conduct detailed examination of codebase alignment with documentation
- Verify architecture documentation reflects current implementation
- Validate relevance and accuracy of existing decisions, solutions, and patterns

**Validation Process:**
- Cross-reference all artifacts against actual codebase
- Identify inconsistencies between documentation and implementation
- Assess currency of decisions and patterns
- Verify solutions remain applicable to current project state

**Update Mechanism:**
- Call `update_knowledge` tool to persist validated artifacts
- Maintain artifact freshness and accuracy
- Preserve all relevant information without arbitrary removal
- Require concrete evidence before making deletion decisions

### Critical Guidelines

**Evidence-Based Changes:**
- Never remove content without clear justification
- Prove irrelevance before deletion
- Maintain conservative approach to modifications
- Document reasoning for all changes

**Knowledge Base Integrity:**
- Treat knowledge base as foundational project resource
- Ensure cleanliness and precision of all artifacts
- Maintain strict alignment with actual codebase
- Support future project development decisions

**Quality Standards:**
- Keep documentation clean and accurate
- Ensure consistency across all artifacts
- Maintain high standards for knowledge base reliability
- Provide solid foundation for ongoing project work

The knowledge base serves as the authoritative source for project understanding and must remain trustworthy, current, and precisely aligned with the actual project implementation.

---

# Add think mode
 - for spec write
 - for task create
 - for issue handle

---
# Remove duplicates in templates


---
# Optimize context loading???
 - general (always load)
 - domen scope (semantic search)

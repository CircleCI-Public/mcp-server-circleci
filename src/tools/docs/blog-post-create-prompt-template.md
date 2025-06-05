# Turn your AI ideas into testable prompt templates without leaving your IDE

_Engineering Productivity • [Date] • 6 min read_

**Ryan Hamilton**  
_Senior Software Engineer_

---

Building AI-powered features starts with a great prompt. But here's where most teams diverge into two very different challenges:

**Path 1:** You have a brilliant idea for a new AI feature, but how do you turn those requirements into something you can systematically test, iterate on, and deploy?

**Path 2:** Your codebase is littered with ad-hoc prompts scattered across different files—some hardcoded strings, others in config files, most completely untested. How do you bring order to this chaos?

This post shows how the `create_prompt_template` tool in the CircleCI MCP Server handles both scenarios, transforming either new AI feature requirements or existing prompts into structured, testable templates directly from your IDE.

For new features, you'll type:

```plaintext
Create a prompt template for generating bedtime stories based on topic and age
```

For existing prompts, you'll paste:

```plaintext
Please find and standardize our content summarizer prompt into a more testable template.
```

In both cases, you get a structured template with defined parameters, ready for systematic testing and team collaboration.

## Two paths to better AI development

### Path 1: From requirements to templates

Moving from AI feature ideas to structured templates eliminates the "now what?" moment that stalls most projects:

- You have a new AI feature idea and want to quickly prototype a testable version
- You're planning an AI feature and need to define clear parameters upfront
- You're collaborating with product managers who need to understand AI feature scope
- You're preparing to estimate development effort for AI capabilities

### Path 2: From chaos to structure

Discovering and standardizing existing prompts transforms your AI technical debt:

- Your codebase has scattered prompts with inconsistent formatting and no tests
- You're inheriting a project and need to understand what AI features already exist
- You're preparing to scale AI development but lack visibility into current prompts
- You're moving toward systematic testing but first need to structure existing prompts
- You're trying to establish team standards for AI development going forward

Both paths lead to the same destination: structured, parameterized templates that enable systematic testing, team collaboration, and confident deployment.

## Why this transformation matters

Whether starting fresh or cleaning up existing code, structured templates become the foundation for everything that follows:

- **Systematic testing** across different parameter combinations
- **Team collaboration** on prompt improvements
- **Version control** and change tracking for AI features
- **Automated evaluation** pipelines
- **Documentation** that actually reflects what your AI features do

The tool pairs perfectly with `recommend_prompt_template_tests` and `run_evaluation_tests`, creating a complete workflow from idea (or existing code) to validated AI feature.

## Prerequisites

Before you begin, make sure you have:

- A CircleCI account
- Node.js 18 or later
- An IDE that supports the CircleCI MCP Server (like Cursor)
- Basic familiarity with AI prompts and templating

For the codebase path, you'll also want to identify where AI prompts currently exist in your project.

## Preparing your environment

To use the prompt template tools, you'll need the CircleCI MCP Server configured in your IDE. This gives your assistant access to the AI toolchain for prompt development and testing.

During setup, you'll connect to CircleCI and configure the MCP server. Once connected, your assistant can create templates, generate tests, and run evaluations without leaving your editor.

## Path 1: Creating templates from new requirements

### Step 1: Define your AI feature requirements

Start by clearly describing what you want your AI feature to accomplish:

```plaintext
Create a prompt template for a customer support chatbot that can:
- Classify customer inquiries by urgency and department
- Provide appropriate responses based on company policies
- Escalate complex issues to human agents
- Maintain a helpful and professional tone
```

### Step 2: Generate your structured template

The assistant uses the `create_prompt_template` tool to analyze your requirements and return:

1. **A structured template** - Your requirements transformed into a clear prompt with parameter placeholders
2. **A context schema** - Defines exactly what inputs the template expects
3. **Metadata** - Information about the template's purpose and target model

```yaml
template: |
  You are a helpful customer support assistant for {{company_name}}. 

  Customer inquiry: {{customer_message}}
  Customer context: {{customer_tier}} customer, previous interactions: {{interaction_history}}

  Please:
  1. Classify this inquiry as {{urgency_levels}} urgency
  2. Identify the appropriate department: {{departments}}
  3. Provide a helpful response following our {{tone}} tone
  4. If the issue requires escalation, explain why and to whom

contextSchema:
  company_name: string
  customer_message: string
  customer_tier: string
  interaction_history: string
  urgency_levels: string
  departments: string
  tone: string
```

## Path 2: Structuring existing prompts from your codebase

### Step 1: Audit your existing prompts

First, identify where AI prompts currently exist in your codebase. Common locations include:

- Hardcoded strings in application code
- Configuration files or environment variables
- Template files or prompt libraries
- API calls to AI services
- Documentation or comments with example prompts

### Step 2: Extract and structure existing prompts

The assistant can discover prompts in your codebase and transform them into structured templates:

```plaintext
Please find and standardize our content summarizer prompt into a more testable template.
```

The assistant transforms your existing prompt into a proper template:

```yaml
template: |
  Write a summary of the following content for a {{target_audience}} audience. 
  Keep it under {{word_limit}} words and focus on {{focus_areas}}.

  Content to summarize:
  {{content}}

contextSchema:
  target_audience: string
  word_limit: number
  focus_areas: string
  content: string
```

### Step 3: Discover patterns across your codebase

As you structure multiple existing prompts, you'll often discover:

- **Common parameters** that should be standardized (like tone, audience, length)
- **Missing edge case handling** in current prompts
- **Inconsistent approaches** to similar tasks
- **Opportunities for consolidation** where multiple prompts could be unified

```plaintext
I have three different summarization prompts in my codebase. Can you help me create a unified template that handles all these use cases?
```

## Universal next steps (both paths)

### Review and refine

Whether starting from requirements or existing code, you can immediately refine the generated template:

```plaintext
The template looks good, but can you add a parameter for handling different languages and make the tone more conversational?
```

### Save and prepare for testing

Save your template to the `./prompts` directory following the naming convention (e.g., `customer-support-chatbot.prompt.yml`).

Then immediately move to testing:

```plaintext
Now generate test cases for this template
```

This triggers the `recommend_prompt_template_tests` tool, creating comprehensive test coverage based on your template structure.

## Scaling across your AI development

### For new AI features

```plaintext
Create prompt templates for all the AI features in our product roadmap
```

### For existing codebases

```plaintext
Help me audit my entire codebase for AI prompts and create structured templates for each one
```

### For team standardization

```plaintext
Create a style guide for our prompt templates based on the ones we've structured
```

## From templates to production

With structured templates in place, you can rapidly move through the full development cycle:

**Generate comprehensive tests:**

```plaintext
recommend test cases for this customer support template
```

**Run automated evaluations:**

```plaintext
run evaluation tests for all my prompt templates
```

**Iterate based on results:**

```plaintext
the evaluation showed issues with escalation logic - can you adjust the template?
```

Each step builds on the structured foundation, making AI feature development more systematic and collaborative.

## Conclusion

Whether you're starting with a brilliant AI feature idea or trying to wrangle existing prompts scattered across your codebase, the path to reliable AI development is the same: structure first, then test systematically.

The `create_prompt_template` tool doesn't just format your prompts—it transforms how you approach AI feature development. For new features, you get structured parameters and systematic testing from day one. For existing code, you finally gain visibility and control over your AI capabilities.

The jump from "I have an AI idea" or "I have these random prompts" to "I have testable, collaborative AI features" is often where good intentions stall out. When you can quickly structure any requirement or existing prompt into a proper template, that gap disappears.

Combined with the full MCP toolkit for prompt testing and evaluation, you can move from idea to validated AI feature—or from scattered prompts to systematic AI development—without ever leaving your IDE.

You can get started by trying the tool with your next AI feature idea or by auditing your codebase for existing prompts. Once you experience the difference between structured and ad-hoc prompt development, you won't go back.

---

_Engineering Productivity_

## Similar posts you may enjoy

- **Systematically test your AI prompts with automated evaluation suites** - [Date] - 5 min read
- **Run comprehensive prompt evaluations directly from your IDE** - [Date] - 6 min read
- **Check the status of your CircleCI pipeline without leaving your IDE** - May 30, 2025 - 5 min read

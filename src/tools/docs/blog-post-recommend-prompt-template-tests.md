# Systematically test your AI prompts with automated evaluation suites

_Engineering Productivity • [Date] • 5 min read_

**Ryan Hamilton**  
_Senior Software Engineer_

---

You've built a solid prompt template. It works great for the happy path cases you tested manually. But what about edge cases? What happens with unusual inputs, different parameter combinations, or scenarios you haven't thought of yet?

Most teams test AI prompts the same way they tested software 20 years ago: manually, inconsistently, and only for obvious cases. You run a few examples, tweak the prompt, run a few more. It works until you ship it and discover all the ways real users break your assumptions.

This post shows how to generate comprehensive test suites for your prompt templates directly from your IDE using the `recommend_prompt_template_tests` tool in the CircleCI MCP Server. You'll start with a structured template and get back a systematic evaluation plan that covers edge cases, parameter variations, and real-world scenarios you might have missed.

Type something like:

```plaintext
Generate test cases for my customer support chatbot template
```

The assistant returns a complete test suite with diverse scenarios, edge cases, and evaluation criteria—ready to run automatically.

## Why this is useful

Moving from manual spot-checking to systematic evaluation sounds like overkill, but it catches issues before your users do:

- You want to validate your prompt works across all possible input combinations
- You're preparing to deploy an AI feature and need confidence it handles edge cases
- You're iterating on a prompt and want to ensure changes don't break existing functionality
- You're working on a team and need reproducible, shareable test standards
- You're debugging prompt failures and need systematic coverage to isolate issues
- You're comparing different prompt versions and need consistent evaluation criteria

In all these scenarios, comprehensive test coverage is what separates reliable AI features from ones that work "most of the time." This tool generates that coverage automatically, based on your specific template structure.

It bridges the gap between `create_prompt_template` and `run_evaluation_tests`, turning structured templates into validated, production-ready AI features.

## Prerequisites

Before you begin, make sure you have:

- A CircleCI account
- Node.js 18 or later
- An IDE that supports the CircleCI MCP Server (like Cursor)
- At least one prompt template created with the `create_prompt_template` tool
- Basic understanding of AI prompt evaluation

You'll also need your prompt template file ready in the `./prompts` directory of your project.

## Preparing your environment

To generate test recommendations, you'll need the CircleCI MCP Server configured in your IDE with access to your prompt templates.

The tool analyzes your template structure, parameter types, and intended use case to generate appropriate test scenarios. Once connected, you can generate comprehensive test suites for any structured template without leaving your editor.

## Step 1: Start with a structured template

This tool works best when you have a properly structured prompt template. If you don't have one yet, use the `create_prompt_template` tool first:

```plaintext
Create a prompt template for my code review assistant that analyzes pull requests
```

Once you have a structured template saved in your `./prompts` directory, you're ready to generate tests. The template should include clear parameter definitions and a well-defined context schema.

## Step 2: Generate comprehensive test cases

Open the AI assistant in your IDE and request test generation for your template:

```plaintext
Generate test cases for my bedtime-story-generator.prompt.yml template
```

The assistant uses the `recommend_prompt_template_tests` tool to analyze your template and return a comprehensive test suite covering:

**Happy path scenarios:**

- Typical use cases with common parameter values
- Standard input combinations that represent normal usage

**Edge cases:**

- Boundary values (very young/old ages, extremely long/short topics)
- Empty or missing parameters
- Invalid input types

**Parameter variations:**

- Different combinations of optional parameters
- Minimum and maximum value testing
- Special characters and unusual inputs

**Real-world scenarios:**

- Common user mistakes and typos
- Culturally diverse examples
- Context-specific variations

Here's what a generated test suite might look like:

```yaml
tests:
  - name: 'Standard bedtime story for 5-year-old'
    context:
      topic: 'friendly dragon'
      age: 5
      duration: 3
    expectations:
      - 'Story should be age-appropriate for 5-year-old'
      - 'Should include friendly, non-scary dragon'
      - 'Should end with calming conclusion'

  - name: 'Edge case - very young child'
    context:
      topic: 'puppies'
      age: 2
      duration: 2
    expectations:
      - 'Language should be very simple'
      - 'No complex plot elements'
      - 'Focus on soothing imagery'

  - name: 'Complex topic handling'
    context:
      topic: 'space exploration and rocket ships'
      age: 8
      duration: 5
    expectations:
      - 'Should simplify complex concepts'
      - 'Maintain educational value'
      - 'Age-appropriate scientific accuracy'
```

## Step 3: Review and customize the test suite

The generated tests provide comprehensive coverage, but you can immediately customize them based on your specific requirements:

```plaintext
The test cases look good, but can you add some tests for handling inappropriate topics and multilingual names?
```

The assistant will expand the test suite with your requested scenarios, maintaining the structured format while adding your specific concerns.

## Step 4: Understand the evaluation criteria

Each test case comes with clear expectations that define what success looks like. The tool generates evaluation criteria based on:

- **Your template's intended purpose** - What the prompt is supposed to accomplish
- **Parameter constraints** - How different inputs should affect outputs
- **Common failure modes** - Known issues with similar prompt types
- **Quality standards** - Appropriate tone, accuracy, and completeness expectations

These criteria become the foundation for automated evaluation, giving you consistent standards across all test runs.

## Step 5: Prepare for automated testing

With your test suite generated, you can immediately move to automated evaluation:

```plaintext
Run evaluation tests using these test cases
```

This triggers the `run_evaluation_tests` tool, which executes your entire test suite against your prompt template and provides detailed results on which scenarios pass, fail, or need attention.

The systematic approach means you can:

- **Catch regressions early** when modifying prompts
- **Compare different template versions** objectively
- **Share evaluation standards** across your team
- **Build confidence** before deploying AI features

## Beyond individual templates

The real power emerges when you use this systematic approach across all your AI features:

**Standardize testing practices:**

```plaintext
Generate test suites for all templates in my ./prompts directory
```

**Compare template performance:**

```plaintext
Run comparative evaluation between my two customer-support templates
```

**Build evaluation pipelines:**

```plaintext
Set up automated testing for prompt template changes
```

This transforms ad-hoc prompt testing into a systematic, collaborative process that scales with your AI development.

## Conclusion

The gap between "this prompt works for me" and "this prompt works reliably in production" is filled with edge cases, user variations, and scenarios you haven't considered. When you can automatically generate comprehensive test coverage for any prompt template, that gap disappears.

The `recommend_prompt_template_tests` tool doesn't just create test cases—it systematically thinks through all the ways your prompt might succeed or fail. Instead of discovering issues after deployment, you identify and fix them during development.

Combined with structured templates and automated evaluation, you get a complete workflow for building reliable AI features. That's the difference between hoping your prompts work and knowing they do.

You can get started by using this tool with any prompt template you've created. Once you see the depth of test coverage it generates automatically, manual testing will feel incomplete.

---

_Engineering Productivity_

## Similar posts you may enjoy

- **Turn your AI ideas into testable prompt templates without leaving your IDE** - [Date] - 6 min read
- **Run comprehensive prompt evaluations directly from your IDE** - [Date] - 6 min read
- **Check the status of your CircleCI pipeline without leaving your IDE** - May 30, 2025 - 5 min read

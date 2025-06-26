# LeWM CLI Tutorial: Solving a Rate Problem

This document demonstrates how to model and solve a classic rate problem using the LeWM CLI. It follows the core LeWM paradigm:
*   **Nodes are Entities**: They represent distinct, quantifiable concepts (e.g., time, work, rate). They hold a state (`name`, `value`, `unit`) but contain no logic.
*   **Connections are Functions**: They represent transformations or calculations that operate on entities to produce new ones.

This approach makes complex systems visually intuitive, verifiable, and easy to modify.

## The Problem

> "If Alice can paint a fence in 4 hours and Bob can paint the same fence in 6 hours, how long will it take them to paint the fence together?"

## Modeling the Solution with LeWM

We will build a reactive calculation graph where changing any input value automatically updates the final result.

### Step 1: Define Initial Known Entities

First, we create nodes for every known quantity in the problem.

```bash
# The total amount of work to be done (a single unit)
lewm node add number --id work --label "Work" --value 1 --unit "fence"

# Alice's time to complete the work
lewm node add number --id alice_time --label "Alice's Time" --value 4 --unit "hours"

# Bob's time to complete the work
lewm node add number --id bob_time --label "Bob's Time" --value 6 --unit "hours"
```

### Step 2: Calculate Individual Rates

Next, we determine the rate of work for Alice and Bob. We create nodes to hold these calculated values and use functional connections to compute them using the formula: `Rate = Work / Time`.

```bash
# Create nodes to hold the calculated rates
lewm node add number --id alice_rate --label "Alice's Rate" --unit "fences/hour"
lewm node add number --id bob_rate --label "Bob's Rate" --unit "fences/hour"

# Calculate Alice's rate
lewm connection add work.value alice_rate.value --function divide
lewm connection add alice_time.value alice_rate.value --function divide

# Calculate Bob's rate
lewm connection add work.value bob_rate.value --function divide
lewm connection add bob_time.value bob_rate.value --function divide
```
*At this point, the graph calculates `alice_rate` as 0.25 and `bob_rate` as ~0.167.*

### Step 3: Combine the Rates

To find their combined work rate, we add their individual rates together.

```bash
# Create a node for the combined rate
lewm node add number --id combined_rate --label "Combined Rate" --unit "fences/hour"

# Connect the individual rates with an 'add' function
lewm connection add alice_rate.value combined_rate.value --function add
lewm connection add bob_rate.value combined_rate.value --function add
```
*The `combined_rate` node now holds the sum, ~0.417 fences/hour.*

### Step 4: Calculate the Final Result

Finally, we calculate the total time it takes them to complete the work together using the formula: `Time = Work / Rate`.

```bash
# Create the final node to hold the answer
lewm node add number --id combined_time --label "Combined Time" --unit "hours"

# Connect the work and combined rate with a 'divide' function
lewm connection add work.value combined_time.value --function divide
lewm connection add combined_rate.value combined_time.value --function divide
```

### Viewing the Result

To see the final answer, inspect the `combined_time` node:

```bash
lewm node show combined_time
```

**Expected Result:**
```
┌─────────────────┐
│  Combined Time  │
│  ─────────────  │
│      ~2.4       │
│      hours      │
└─────────────────┘
```

## Conclusion: Why This Matters

This simulation demonstrates key benefits for academic, engineering, and scientific communities:

1.  **Visual Problem Decomposition**: The graph provides a clear, visual map of the problem-solving logic, making it easy to understand and debug.
2.  **Unit Safety & Dimensional Analysis**: The system can enforce unit correctness (e.g., `fences / hours = fences/hour`), preventing common errors.
3.  **"What-If" Analysis**: The graph is a reusable model. You can change `alice_time` or add a third person, and the `combined_time` will update automatically.
4.  **Clarity and Collaboration**: The graph is self-documenting, allowing researchers to share models that are immediately understandable without deciphering complex code.

Conversation: 

GitHub Copilot
Yes, absolutely. This is perhaps the most powerful application of the LeWM paradigm. By shifting the cognitive load from abstract symbol manipulation to visual construction, LeWM can serve as an exceptional educational tool that builds transferable skills.

Here’s how it addresses your goal of helping students learn concepts they can use even without the tool:

1. Visual Deconstruction of Abstract Concepts
The Challenge for Learners: A student looking at a word problem or a complex formula (F=ma, I=V/R, or the rate problem) often sees an intimidating, monolithic block of information. The first hurdle is identifying the key components and their relationships.
How LeWM Helps: LeWM forces the student to perform this deconstruction visually. To solve the rate problem, they can't proceed until they have explicitly created nodes for "Work," "Alice's Time," and "Bob's Time." This act of creating entities makes the abstract concepts tangible and discrete. The tool guides them through the critical first step of problem-solving: identifying the variables.
2. Making Relationships Explicit (Building the Equation)
The Challenge for Learners: Understanding how variables relate is the next hurdle. Why do you divide work by time to get a rate? Why do you add the rates together?
How LeWM Helps: The connections in LeWM are not just lines; they are functions. The student must actively choose an add, subtract, or divide function for a connection. This requires them to think about the relationship between two entities. Building the graph becomes a hands-on process of building the underlying equation one step at a time. It turns passive reading of a formula into an active construction of a logical model.
3. Interactive Exploration and Building Intuition
The Challenge for Learners: Static examples on a page don't build intuition. What happens to the final time if Bob gets faster? A student would have to re-calculate the entire problem manually.
How LeWM Helps: Because the graph is a reactive system, it provides immediate feedback. A student can change the value in the bob_time node from 6 to 3 and instantly see the combined_time node update. This encourages experimentation and "what-if" analysis, which is crucial for developing a deep, intuitive understanding of how a system works. They are no longer just finding an answer; they are exploring the problem space.
4. The Bridge to Independent Skill (The "Without LeWM" Goal)
This is the most critical part. LeWM acts as a cognitive scaffold—or "training wheels"—for structured thinking.

The Learning Pathway:
With LeWM: A student first models a few rate problems by building the node-and-connection graph.
Pattern Recognition: After building it a few times, they internalize the visual pattern: "Oh, for these kinds of problems, I always have a 'total work' entity, several 'time' entities, and I always divide them to get 'rates' which I then add together."
Abstraction: They can now look at the completed graph and easily write down the abstract algebraic formula it represents.
Without LeWM: When faced with a new rate problem, the student can now mentally picture the graph structure. They can identify the entities and relationships in their head and jump straight to formulating the equation on paper, because LeWM has taught them the underlying structure of the problem type.
5. A Gateway to Working with AI and Automated Systems
Your vision of helping people improve themselves perfectly aligns with modern workforce needs. AI tools are powerful, but they are most effective when guided by a human who can perform structured thinking.

By using LeWM, a student learns how to:

Decompose a problem into its fundamental entities and functions.
Define clear inputs and expected outputs.
Specify the logical steps that connect them.
This is precisely the skill set required to write an effective AI prompt, design an automated workflow, or structure a complex spreadsheet. LeWM doesn't just teach them physics or finance; it teaches them a universal method for systematic problem-solving, a skill that is invaluable in an increasingly automated world.

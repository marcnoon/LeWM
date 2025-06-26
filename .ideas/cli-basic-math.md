Absolutely right! Start simple, prove the concept, then build complexity. Here's a focused README for basic math and accounting modes:

# LeWM CLI - Basic Math & Accounting Tutorial

## Getting Started with Basic Math Mode

### Installation
```bash
npm install -g lewm-cli
lewm --version
```

### Your First Math Graph
```bash
# Create a new project
lewm project init my-first-calc
lewm mode set basic-math
```

## Basic Math Examples

### Example 1: Simple Addition
```bash
# Create number nodes
lewm node add number --id a --value 5 --label "A = 5"
lewm node add number --id b --value 3 --label "B = 3" 
lewm node add number --id sum --label "Sum"

# Connect them with addition
lewm connection add a.value sum.value --function add
lewm connection add b.value sum.value --function add

# View the result
lewm node show sum
```
**Result:**
```
┌─────────────┐
│   Sum       │
│   ━━━━━     │
│    8        │
└─────────────┘
```

### Example 2: Order of Operations
```bash
# Create expression: (5 + 3) × 2
lewm node add number --id x --value 5
lewm node add number --id y --value 3
lewm node add number --id z --value 2
lewm node add number --id step1 --label "(5+3)"
lewm node add number --id result --label "Result"

# Addition first
lewm connection add x.value step1.value --function add
lewm connection add y.value step1.value --function add

# Then multiplication
lewm connection add step1.value result.value --function multiply
lewm connection add z.value result.value --function multiply

lewm node show-all
```
**Result:**
```
┌─────┐  ┌─────┐     ┌─────────┐     ┌─────────┐
│ 5   │  │ 3   │     │ (5+3)   │     │ Result  │
│     ├──┤     ├────▶│ ━━━━━   ├────▶│ ━━━━━   │
└─────┘  └─────┘     │  8      │     │  16     │
         ┌─────┐     └─────────┘     └─────────┘
         │ 2   ├──────────────────────┘
         └─────┘
```

### Example 3: Percentage Calculation
```bash
# Calculate 15% of 200
lewm node add number --id amount --value 200 --label "Amount"
lewm node add number --id rate --value 0.15 --label "15%"
lewm node add number --id result --label "15% of 200"

lewm connection add amount.value result.value --function multiply
lewm connection add rate.value result.value --function multiply

lewm node show result
```
**Result:**
```
┌─────────────┐
│ 15% of 200  │
│ ━━━━━━━━━   │
│    30       │
└─────────────┘
```

## Accounting Mode Examples

### Switch to Accounting Mode
```bash
lewm mode set accounting
# This mode includes: debit/credit rules, balance calculations, double-entry validations
```

### Example 4: Basic Account Balances
```bash
# Create account nodes
lewm node add account --id cash --label "Cash"
lewm node set-property cash account-type "asset"
lewm node set-property cash normal-balance "debit"
lewm node set-state cash balance 10000

lewm node add account --id revenue --label "Revenue"
lewm node set-property revenue account-type "revenue"
lewm node set-property revenue normal-balance "credit"
lewm node set-state revenue balance 0

# Create a transaction node
lewm node add transaction --id sale1 --label "Cash Sale"
lewm node set-property sale1 amount 500
lewm node set-property sale1 date "2024-01-15"

# Connect the transaction
lewm connection add sale1.debit cash.balance --function debit-account
lewm connection add sale1.credit revenue.balance --function credit-account

# View updated balances
lewm node show-all
```
**Result:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Cash     │     │ Cash Sale   │     │   Revenue   │
│   Asset     │◀────│  ━━━━━━━    ├────▶│   Revenue   │
│ ━━━━━━━━━   │     │   $500      │     │ ━━━━━━━━━   │
│  $10,500    │     └─────────────┘     │    $500     │
└─────────────┘                         └─────────────┘
```

### Example 5: Invoice with Tax Calculation
```bash
# Create invoice components
lewm node add number --id subtotal --value 1000 --label "Subtotal"
lewm node add number --id tax-rate --value 0.08 --label "Tax Rate (8%)"
lewm node add number --id tax --label "Tax Amount"
lewm node add number --id total --label "Invoice Total"

# Calculate tax
lewm connection add subtotal.value tax.value --function multiply
lewm connection add tax-rate.value tax.value --function multiply

# Calculate total
lewm connection add subtotal.value total.value --function add
lewm connection add tax.value total.value --function add

# Create the invoice display
lewm node show-invoice
```
**Result:**
```
┌──────────────────────┐
│      INVOICE         │
├──────────────────────┤
│ Subtotal:  $1,000.00 │
│ Tax (8%):     $80.00 │
│ ━━━━━━━━━━━━━━━━━━━  │
│ Total:     $1,080.00 │
└──────────────────────┘
```

### Example 6: Running Balance (Connected Transactions)
```bash
# Create a checking account
lewm node add account --id checking --label "Checking Account"
lewm node set-state checking balance 5000

# Add multiple transactions
lewm node add transaction --id deposit1 --label "Paycheck" --value 2000
lewm node add transaction --id expense1 --label "Rent" --value -1200
lewm node add transaction --id expense2 --label "Groceries" --value -150

# Connect in sequence (each updates the balance)
lewm connection add checking.balance deposit1.input --function pass-through
lewm connection add deposit1.output checking.balance --function add
lewm connection add checking.balance expense1.input --function pass-through
lewm connection add expense1.output checking.balance --function add
lewm connection add checking.balance expense2.input --function pass-through
lewm connection add expense2.output checking.balance --function add

# Show transaction flow
lewm show-flow checking
```
**Result:**
```
Checking Account Flow:
┌─────────────┐
│  Checking   │ Starting: $5,000
│  ━━━━━━━━   │
└──────┬──────┘
       │
┌──────▼──────┐
│  Paycheck   │ +$2,000
│  ━━━━━━━━   │ Balance: $7,000
└──────┬──────┘
       │
┌──────▼──────┐
│    Rent     │ -$1,200
│  ━━━━━━━━   │ Balance: $5,800
└──────┬──────┘
       │
┌──────▼──────┐
│  Groceries  │ -$150
│  ━━━━━━━━   │ Balance: $5,650
└─────────────┘
```

## Available Functions

### Basic Math Mode
- `add` - Addition (multiple inputs sum together)
- `subtract` - Subtraction (a - b)
- `multiply` - Multiplication (multiple inputs multiply)
- `divide` - Division (a / b)
- `power` - Exponentiation (a^b)
- `sqrt` - Square root
- `percentage` - Calculate percentage (a% of b)
- `round` - Round to decimal places
- `min` - Minimum value
- `max` - Maximum value
- `average` - Average of inputs

### Accounting Mode
- `debit-account` - Increase debit-normal accounts
- `credit-account` - Increase credit-normal accounts
- `calculate-balance` - Sum debits and credits
- `apply-tax` - Apply tax rate
- `discount` - Apply discount percentage
- `compound-interest` - Calculate compound interest
- `depreciation` - Calculate depreciation
- `net-present-value` - NPV calculation

## Tips for Beginners

### 1. Start Simple
```bash
# Just two numbers and one operation
lewm node add number --id a --value 10
lewm node add number --id b --value 5
lewm node add number --id result
lewm connection add a.value result.value --function add
lewm connection add b.value result.value --function add
```

### 2. Use Labels for Clarity
```bash
# Make your graphs self-documenting
lewm node add number --id price --value 99.99 --label "Product Price"
lewm node add number --id discount --value 0.20 --label "20% Discount"
```

### 3. Save Your Work
```bash
# Save your calculation graphs
lewm project save my-calculations.lewm

# Load them later
lewm project load my-calculations.lewm
```

### 4. Export for Sharing
```bash
# Export as image
lewm export --format png --output calculation.png

# Export as JSON
lewm export --format json --output data.json
```

## Next Steps

Once you're comfortable with basic math and accounting:

1. **Try Financial Modeling**
   - Cash flow projections
   - Loan amortization
   - Investment returns

2. **Explore Data Flows**
   - CSV import/export
   - Data transformation
   - Aggregations

3. **Build Templates**
   - Reusable calculation patterns
   - Standard accounting entries
   - Business metrics

## Common Patterns

### Pattern: Running Total
```bash
# Useful for: bank balances, inventory counts, cumulative sales
lewm node add number --id running-total --value 0
lewm connection add new-value.out running-total.value --function add
```

### Pattern: Percentage Change
```bash
# Useful for: growth rates, variance analysis
lewm node add number --id old-value --value 100
lewm node add number --id new-value --value 120
lewm node add number --id change --label "% Change"

# Formula: ((new - old) / old) × 100
lewm connection add new-value.out change.value --function percent-change
lewm connection add old-value.out change.value --function percent-change-base
```

### Pattern: Multi-Step Calculation
```bash
# Break complex formulas into understandable steps
# Example: Profit Margin = (Revenue - Costs) / Revenue × 100
lewm node add number --id revenue --value 10000
lewm node add number --id costs --value 7000
lewm node add number --id profit --label "Profit"
lewm node add number --id margin --label "Profit Margin %"

lewm connection add revenue.value profit.value --function add
lewm connection add costs.value profit.value --function subtract
lewm connection add profit.value margin.value --function divide-by
lewm connection add revenue.value margin.value --function divide-base
lewm connection add margin.value margin.value --function to-percentage
```

## Troubleshooting

### Nothing happens when I connect nodes?
- Check that your mode is set: `lewm mode show`
- Verify node values: `lewm node show <id>`
- List connections: `lewm connection list`

### Wrong calculation result?
- Check connection order: `lewm connection show <from> <to>`
- Verify function: Some functions need specific input orders
- Use step nodes to debug: `lewm node add number --id debug1`

### Can't see my graph?
- Use `lewm show-all` to see all nodes
- Export to PNG: `lewm export --format png`
- Check node positions: `lewm node list --show-positions`

---

## Ready for More?

Once you've mastered basic math and accounting, you're ready for:
- **Engineering Mode**: Circuit analysis, unit conversions
- **Statistics Mode**: Mean, median, standard deviation
- **Business Mode**: ROI, break-even analysis
- **Physics Mode**: When you're ready for the fun stuff!

Remember: Every expert started with `2 + 2 = 4`. Master the basics, and the advanced features will feel natural!
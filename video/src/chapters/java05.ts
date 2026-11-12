import type { Chapter } from "../lib/types.ts";
import { makeCheck } from "./checks.ts";
import { ask, B, custom, sayit, sec } from "./core/h.ts";
import { qa } from "./web/h.ts";

// Java Part 5 (Core Stack JAVA-05): Java 17 → 25, question by question:
// what changed per LTS, records, sealed types, pattern matching.
const check = makeCheck();

export const java05: Chapter = {
  id: "java05",
  label: "Java 5",
  title: "Java 17 to 25: records, sealed types and pattern matching",
  theme: "py",
  voice: "en-US-AndrewMultilingualNeural",
  pace: { normal: "-3%", ask: "-5%", aside: "+4%", excite: "+4%" },
  scenes: [
    {
      kind: "title",
      eyebrow: "Java · Part 5",
      title: "Java 17 to 25",
      subtitle: "records, sealed types and pattern matching",
      beats: B("Java, part five. Modern Java, from seventeen to twenty five: records, sealed types, and pattern matching. Rounds ask this to check you write today's Java, not Java eight with a newer compiler."),
    },
    {
      kind: "bullets",
      title: "What interviews ask on this topic",
      firstItemStep: 1,
      items: [
        { icon: "📅", text: "Java 8 vs 11 vs 17 vs 21: what changed that you actually use?" },
        { icon: "🧾", text: "What are records, and when is a record the wrong choice?" },
        { icon: "🔒", text: "What are sealed classes, and what do they give you?" },
        { icon: "🔀", text: "Pattern matching, switch expressions, text blocks: show an example" },
      ],
      beats: B(
        "Four questions, from real rounds at Paytm, EPAM and others.",
        "What changed between the long-term support releases that you actually use.",
        "Records, and when a record is the wrong choice.",
        "Sealed classes, and what they give you.",
        { say: "And pattern matching with switch expressions. And at the end, we'll see how the last three fit together into one idea.", tone: "key" },
      ),
    },

    // ================================================================ 1
    sec("1", "The LTS releases", "Question one. Java eight versus eleven versus seventeen versus twenty one. And now twenty five."),
    custom(
      "pytape",
      {
        title: "The long-term support releases, and what each one gave you",
        sub: "a new feature release every 6 months; an LTS every 2 years",
        cells: ["8 (2014)", "11 (2018)", "17 (2021)", "21 (2023)", "25 (2025)"],
        idx: false,
        steps: [
          { pick: [0], out: "lambdas, streams, Optional, java.time, default methods" },
          { pick: [1], out: "var (10), HttpClient, String.isBlank/strip/lines/repeat, run a .java file directly" },
          { pick: [2], out: "records, sealed classes, pattern matching for instanceof, switch expressions, text blocks" },
          { pick: [3], out: "virtual threads, pattern matching for switch, record patterns, sequenced collections" },
          { pick: [4], out: "scoped values, flexible constructor bodies, compact source files, compact object headers" },
        ],
      },
      B(
        "Java eight, twenty fourteen, the big one: lambdas, streams, Optional, the java dot time API, and default methods on interfaces. A lot of codebases still feel like this.",
        "Eleven: var for local variables arrived in ten, plus the new HTTP client, handy String methods like is blank, strip and lines, and running a single source file directly.",
        "Seventeen: the release this lecture is about. Records, sealed classes, pattern matching for instanceof, switch expressions, and text blocks. It's also the minimum for Spring Boot three.",
        "Twenty one: virtual threads, which is the headline, plus pattern matching for switch, record patterns, and sequenced collections, which finally give lists and ordered sets a common get first and get last.",
        { say: "And twenty five, the current long-term release, from September twenty twenty five: scoped values, flexible constructor bodies that let you validate before calling super, compact source files with a simple main method, and compact object headers, which can shrink every object's header to save memory.", tone: "key" },
      ),
    ),
    sayit("Java 8 vs 11 vs 17 vs 21: what changed that you actually use?", "Answer it with what you use, not a list of JEPs:", [
      ["8: lambdas, streams, Optional, java.time", "From eight, lambdas, streams, Optional, and java dot time, every day."],
      ["11: var, the HTTP client, String helpers", "From eleven, var, the built-in HTTP client, and the String helpers."],
      ["17: records for DTOs, sealed types, switch expressions, text blocks", "From seventeen, records for DTOs and events, sealed types, switch expressions, and text blocks for SQL and JSON."],
      ["21: virtual threads for blocking I/O, pattern matching for switch", "From twenty one, virtual threads for blocking I O, and pattern matching for switch."],
      ["25 is the current LTS: scoped values, flexible constructors; plan upgrades LTS to LTS", "Twenty five is the current long-term release, with scoped values and flexible constructors, and teams usually upgrade from one LTS to the next."],
    ]),

    // ================================================================ 2
    sec("2", "Records", "Question two. What are records, and when is a record the wrong choice?"),
    {
      kind: "code",
      title: "A record: a named tuple of data, generated for you",
      lang: "java",
      code: `public record Money(BigDecimal amount, String currency) {

    public Money {                               // compact constructor
        Objects.requireNonNull(amount);
        if (amount.signum() < 0)
            throw new IllegalArgumentException("negative");
        currency = currency.toUpperCase();       // normalise
    }

    public Money plus(Money o) {                 // methods are allowed
        return new Money(amount.add(o.amount), currency);
    }
}
// generated: private final fields, a constructor,
// amount() and currency() accessors, equals, hashCode, toString`,
      highlight: [[1, 1], [3, 8], [10, 12], [14, 15]],
      beats: B(
        "A record declares a class whose whole state is its components. One line, money with an amount and a currency.",
        "A compact constructor is where validation and normalisation go. No parameter list, no assignments: you just check and adjust the parameters, and the fields are assigned afterwards.",
        "Records can have methods, static factories, and implement interfaces.",
        { say: "And Java generates the rest: private final fields, the canonical constructor, accessors named after the components, without get, and equals, hash code and to string built from all the components. So records are ideal for DTOs, events, map keys and value objects.", tone: "key" },
      ),
    },
    qa(1, "When is a record the wrong choice?", [
      "JPA entities: they need a no-arg constructor, mutable state and proxies; records are final and immutable",
      "When you need inheritance: records are final and can't extend a class (they can implement interfaces)",
      "When state must change over time, or when you have many optional fields (a builder reads better)",
      "Remember it's shallowly immutable: copy mutable components (List.copyOf) in the compact constructor",
    ], { ask: "So, when is a record the wrong choice?" }),

    // ================================================================ 3
    sec("3", "Sealed types", "Question three. What are sealed classes, and what do they give you?"),
    {
      kind: "code",
      title: "Sealed: you choose exactly who may implement it",
      lang: "java",
      code: `public sealed interface Payment
        permits Card, Upi, NetBanking { }

public record Card(String last4, int amountPaise) implements Payment { }
public record Upi(String vpa, int amountPaise) implements Payment { }
public final class NetBanking implements Payment { … }

// each permitted subtype must be final, sealed, or non-sealed
// a class outside the list can't implement Payment: compile error`,
      highlight: [[1, 2], [4, 6], [8, 9]],
      beats: B(
        "A sealed interface or class lists exactly which types may extend it, with permits. Here, a payment is a card, a UPI payment, or net banking. Nothing else.",
        "Each permitted subtype must say what happens next: final, which records already are, sealed again with its own list, or non-sealed to reopen it.",
        { say: "And anyone outside that list who tries to implement Payment gets a compile error. So what do sealed types give you? A closed set of cases the compiler knows about. That's useless on its own, and powerful with the next topic.", tone: "key" },
      ),
    },
    ask("What do sealed classes give you that a normal interface or an enum doesn't?", "a closed hierarchy, with data per case", "What do sealed classes give you, that a normal interface or an enum doesn't?", "Against a normal interface: the set is closed, so the compiler can check you've handled every case. Against an enum: each case can be a different type, carrying its own data, a card's last four digits, a UPI address."),

    // ================================================================ 4
    sec("4", "Pattern matching and switch expressions", "Question four. Pattern matching, switch expressions and text blocks."),
    {
      kind: "code",
      title: "From instanceof-and-cast to patterns",
      lang: "java",
      code: `// before
if (obj instanceof String) {
    String s = (String) obj;
    use(s.length());
}

// Java 16+: pattern matching for instanceof
if (obj instanceof String s && !s.isBlank()) {
    use(s.length());
}

// Java 14+: switch expression: an arrow, a value, no fall-through
int days = switch (month) {
    case FEB -> leap ? 29 : 28;
    case APR, JUN, SEP, NOV -> 30;
    default -> 31;
};`,
      highlight: [[1, 5], [7, 10], [12, 17]],
      beats: B(
        "The old way: test with instanceof, then cast, repeating the type.",
        "Pattern matching for instanceof tests and binds in one step. S is only in scope where the test succeeded, so you can even use it in the same condition.",
        { say: "And switch expressions: arrows instead of colons, no fall-through, so no forgotten break, several labels per case, and the whole switch returns a value. Inside a block, you return a value with yield.", tone: "key" },
      ),
    },
    {
      kind: "code",
      title: "Sealed + records + switch: the compiler checks every case",
      lang: "java",
      code: `String describe(Payment p) {
    return switch (p) {
        case Card c when c.amountPaise() > 1_000_00
                              -> "large card payment";
        case Card(String last4, int amount)
                              -> "card ending " + last4;
        case Upi u            -> "UPI from " + u.vpa();
        case NetBanking n     -> "net banking";
    };                        // no default: the switch is exhaustive
}

// add  record Wallet(...) implements Payment  to the permits list,
// and every switch like this one stops compiling until it handles Wallet`,
      highlight: [[2, 4], [5, 6], [7, 9], [12, 13]],
      beats: B(
        "Java twenty one brings patterns to switch. Each case matches a type, and a when guard adds a condition: card payments over a thousand rupees.",
        "Record patterns take a record apart right in the case: card, with its last four and amount, bound to variables.",
        "And there's no default branch. Payment is sealed, so the compiler knows these three are all the cases, and checks that the switch covers them. That's called exhaustiveness.",
        { say: "Here's the payoff. Add a fourth payment type, a wallet, and every switch like this one stops compiling until it handles wallets. The compiler finds every place you forgot. Sealed types, records and pattern matching together give Java algebraic data types, and that's the senior answer to what sealed classes are for.", tone: "key" },
      ),
    },
    qa(2, "Text blocks: what are they for?", [
      "Multi-line string literals between \"\"\" delimiters: SQL, JSON, HTML in code",
      "Indentation is stripped based on the closing delimiter; no \\n escapes or + concatenation",
      "Combine with .formatted(…) for values; never for building SQL from user input",
    ], { code: `String sql = """\n    SELECT id, total\n    FROM orders\n    WHERE user_id = ?\n    """;` }),
    sayit("Show pattern matching and switch expressions, and say why they matter.", "To finish, the combined answer:", [
      ["instanceof patterns test and bind at once: no casts", "Pattern matching for instanceof tests and binds in one step, so the casts disappear."],
      ["Switch expressions: arrows, no fall-through, return a value", "Switch expressions use arrows, can't fall through, and return a value."],
      ["Java 21: type patterns, record patterns and when guards in switch", "Since twenty one, switch matches on types, takes records apart with record patterns, and adds conditions with when."],
      ["With a sealed type, the switch is exhaustive: a new subtype breaks every unhandled switch at compile time", "And with a sealed type, the switch is checked for exhaustiveness, so adding a new subtype breaks every switch that doesn't handle it, at compile time, not in production."],
    ]),
    check({
      topic: "records",
      q: "Should a JPA @Entity be a record? Why or why not?",
      say: "Should a JPA entity be a record? Why, or why not?",
      a: "No: JPA needs a no-arg constructor, mutable fields and subclass proxies for lazy loading; records are final and immutable. Use records for DTOs and projections instead.",
      aSay: "No. JPA needs a no-argument constructor, mutable fields, and subclass proxies for lazy loading, and records are final and immutable. Use records for DTOs and query projections instead.",
    }),
    check({
      topic: "sealed",
      q: "Why can a switch over a sealed interface have no default branch?",
      say: "Why can a switch over a sealed interface have no default branch?",
      a: "The compiler knows the complete set of permitted subtypes, so it can prove the cases are exhaustive; a new subtype then becomes a compile error at every incomplete switch.",
      aSay: "Because the compiler knows the complete list of permitted subtypes, so it can prove the cases cover everything. And when a new subtype is added, every incomplete switch becomes a compile error.",
    }),
    {
      kind: "drill",
      items: [
        { q: "Current LTS?", a: "Java 25 (Sept 2025)" },
        { q: "Virtual threads arrived in?", a: "Java 21" },
        { q: "A record's accessor for amount?", a: "amount(), not getAmount()" },
        { q: "Can a record extend a class?", a: "No; it can implement interfaces" },
        { q: "Permitted subtypes must be?", a: "final, sealed or non-sealed" },
        { q: "Return a value from a switch block?", a: "yield" },
      ],
      beats: B(
        { say: "Rapid fire. The current long-term release?", hold: 3 },
        "Java twenty five, from September twenty twenty five.",
        { say: "Virtual threads arrived in which version?", hold: 3 },
        "Java twenty one.",
        { say: "A record's accessor for amount?", hold: 3 },
        "Amount, with no get prefix.",
        { say: "Can a record extend a class?", hold: 3 },
        "No. It can implement interfaces.",
        { say: "A sealed type's permitted subtypes must be what?", hold: 3 },
        "Final, sealed, or non-sealed.",
        { say: "How do you return a value from a block inside a switch expression?", hold: 3 },
        { say: "Yield. That's part five.", tone: "key" },
      ),
    },
  ],
};

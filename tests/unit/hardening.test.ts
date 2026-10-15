import { OrderDetails } from "../../src/domain/value-objects/OrderDetails";
import { Money, OrderId } from "../../src/domain/value-objects/PaymentValueObjects";
import { UserId } from "../../src/domain/value-objects/UserValueObjects";
import { Order } from "../../src/domain/entities/Order";
import { OrderCollection } from "../../src/domain/collections/OrderCollection";
import { TaskId, TaskTitle, TaskDescription } from "../../src/domain/value-objects/TaskValueObjects";
import { Task } from "../../src/domain/entities/Task";
import { TaskCollection } from "../../src/domain/collections/TaskCollection";

describe("First-Class Collections + refactor SOLID hardening (RED→GREEN)", () => {
  it("TaskCollection wraps array — add/count/find/filter", () => {
    const col = new TaskCollection();
    expect(col.isEmpty()).toBe(true);
    const t1 = Task.create({ id: TaskId.create("t1"), title: TaskTitle.create("A"), description: TaskDescription.create("") });
    const t2 = Task.create({ id: TaskId.create("t2"), title: TaskTitle.create("B"), description: TaskDescription.create("") });
    t2.changeStatus("in_progress");
    t2.changeStatus("done");
    col.add(t1);
    col.add(t2);
    expect(col.count()).toBe(2);
    expect(col.filterDone().length).toBe(1);
    expect(col.findById(TaskId.create("t1"))?.getTitle().toString()).toBe("A");
    expect(col.filterByStatus("todo").length).toBe(1);
    col.remove(TaskId.create("t1"));
    expect(col.count()).toBe(1);
    expect(col.toArray().length).toBe(1);
  });

  it("OrderCollection — add/filter/total", () => {
    const col = new OrderCollection();
    const o1 = Order.create({ id: OrderId.create("o1"), details: OrderDetails.create(UserId.create("u1"), Money.create(1000)) });
    const o2 = Order.create({ id: OrderId.create("o2"), details: OrderDetails.create(UserId.create("u1"), Money.create(2000)) });
    o1.markPaid();
    col.add(o1);
    col.add(o2);
    expect(col.filterPaid().length).toBe(1);
    expect(col.filterPending().length).toBe(1);
    expect(col.totalPaidAmount()).toBe(1000);
    expect(col.findById(OrderId.create("o2"))?.getAmount().getAmount()).toBe(2000);
  });

  it("Order refactor — no 6 vars, uses OrderDetails + Lifecycle (calisthenics)", () => {
    const details = OrderDetails.create(UserId.create("u1"), Money.create(5000));
    const order = Order.create({ id: OrderId.create("o1"), details });
    expect(order.getPayerId().toString()).toBe("u1");
    expect(order.getAmount().getAmount()).toBe(5000);
    expect(order.getDetails()).toBe(details);
    expect(order.getStatus()).toBe("pending");
  });

  it("OrderDetails rejects zero amount (fail fast)", () => {
    expect(() => OrderDetails.create(UserId.create("u1"), Money.create(0))).toThrow(/cannot be zero/i);
  });

  it("PayOrderUseCase no else — both branches covered via sequential guards", async () => {
    // This is covered by payment.test.ts — this test asserts no else string in the file
    const fs = await import("fs");
    const src = fs.readFileSync("src/application/use-cases/PaymentUseCases.ts", "utf8");
    // Only else allowed is in comments/string — check code pattern "} else {"
    expect(src.includes("} else {")).toBe(false);
  });
});

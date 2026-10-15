import { Task } from "../../src/domain/entities/Task";
import { TaskDescription, TaskId, TaskTitle } from "../../src/domain/value-objects/TaskValueObjects";

describe("Value Objects — RED phase contracts", () => {
  it("TaskId rejects empty", () => {
    expect(() => TaskId.create("")).toThrow(/cannot be empty/i);
    expect(() => TaskId.create("   ")).toThrow();
  });

  it("TaskTitle rejects empty and too long", () => {
    expect(() => TaskTitle.create("")).toThrow(/cannot be empty/i);
    expect(() => TaskTitle.create("a".repeat(121))).toThrow(/max 120/i);
    expect(TaskTitle.create("  Hello  ").toString()).toBe("Hello");
  });

  it("TaskDescription rejects too long", () => {
    expect(() => TaskDescription.create("a".repeat(501))).toThrow(/max 500/i);
    expect(TaskDescription.create("").isEmpty()).toBe(true);
  });

  it("TaskId.generate produces unique ids", () => {
    const a = TaskId.generate().toString();
    const b = TaskId.generate().toString();
    expect(a).not.toBe(b);
  });
});

describe("Task entity — state transitions", () => {
  function makeTask(): Task {
    return Task.create({
      id: TaskId.create("t-1"),
      title: TaskTitle.create("Write tests"),
      description: TaskDescription.create("TDD first"),
    });
  }

  it("creates with status todo", () => {
    const t = makeTask();
    expect(t.getStatus()).toBe("todo");
    expect(t.isDone()).toBe(false);
  });

  it("allows todo -> in_progress -> done", () => {
    const t = makeTask();
    t.changeStatus("in_progress");
    expect(t.getStatus()).toBe("in_progress");
    t.changeStatus("done");
    expect(t.isDone()).toBe(true);
  });

  it("allows in_progress -> todo (reopen)", () => {
    const t = makeTask();
    t.changeStatus("in_progress");
    t.changeStatus("todo");
    expect(t.getStatus()).toBe("todo");
  });

  it("rejects illegal transitions", () => {
    const t = makeTask();
    expect(() => t.changeStatus("done")).toThrow(/cannot transition/i);
    t.changeStatus("in_progress");
    t.changeStatus("done");
    expect(() => t.changeStatus("todo")).toThrow(/cannot transition/i);
  });

  it("rename and changeDescription update fields", () => {
    const t = makeTask();
    t.rename(TaskTitle.create("New title"));
    expect(t.getTitle().toString()).toBe("New title");
    t.changeDescription(TaskDescription.create("new desc"));
    expect(t.getDescription().toString()).toBe("new desc");
  });

  it("reconstitute restores persisted state", () => {
    const t = Task.reconstitute({
      id: TaskId.create("x"),
      title: TaskTitle.create("T"),
      description: TaskDescription.create("D"),
      status: "done",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-02"),
    });
    expect(t.getStatus()).toBe("done");
  });

  it("reconstitute rejects invalid status", () => {
    expect(() =>
      Task.reconstitute({
        id: TaskId.create("x"),
        title: TaskTitle.create("T"),
        description: TaskDescription.create("D"),
        status: "bogus" as never,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(/invalid status/i);
  });
});

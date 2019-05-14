const { mkdir } = Deno;
type FileInfo = Deno.FileInfo;
import { test, runIfMain } from "../testing/mod.ts";
import { assertEquals } from "../testing/asserts.ts";
import { glob } from "./glob.ts";
import { join } from "./path.ts";
import { testWalk } from "./walk_test.ts";
import { touch, walkArray } from "./walk_test.ts";

test({
  name: "glob: glob to regex",
  fn(): void {
    assertEquals(glob("unicorn.*") instanceof RegExp, true);
    assertEquals(glob("unicorn.*").test("poney.ts"), false);
    assertEquals(glob("unicorn.*").test("unicorn.py"), true);
    assertEquals(glob("*.ts").test("poney.ts"), true);
    assertEquals(glob("*.ts").test("unicorn.js"), false);
    assertEquals(
      glob(join("unicorn", "**", "cathedral.ts")).test(
        join("unicorn", "in", "the", "cathedral.ts")
      ),
      true
    );
    assertEquals(
      glob(join("unicorn", "**", "cathedral.ts")).test(
        join("unicorn", "in", "the", "kitchen.ts")
      ),
      false
    );
    assertEquals(
      glob(join("unicorn", "**", "bathroom.*")).test(
        join("unicorn", "sleeping", "in", "bathroom.py")
      ),
      true
    );
    assertEquals(
      glob(join("unicorn", "!(sleeping)", "bathroom.ts"), {
        extended: true
      }).test(join("unicorn", "flying", "bathroom.ts")),
      true
    );
    assertEquals(
      glob(join("unicorn", "(!sleeping)", "bathroom.ts"), {
        extended: true
      }).test(join("unicorn", "sleeping", "bathroom.ts")),
      false
    );
  }
});

testWalk(
  async (d: string): Promise<void> => {
    await mkdir(d + "/a");
    await touch(d + "/a/x.ts");
  },
  async function globInWalk(): Promise<void> {
    const arr = await walkArray(".", { match: [glob("*.ts")] });
    assertEquals(arr.length, 1);
    assertEquals(arr[0], "a/x.ts");
  }
);

testWalk(
  async (d: string): Promise<void> => {
    await mkdir(d + "/a");
    await mkdir(d + "/b");
    await touch(d + "/a/x.ts");
    await touch(d + "/b/z.ts");
    await touch(d + "/b/z.js");
  },
  async function globInWalkWildcardFiles(): Promise<void> {
    const arr = await walkArray(".", { match: [glob("*.ts")] });
    assertEquals(arr.length, 2);
    assertEquals(arr[0], "a/x.ts");
    assertEquals(arr[1], "b/z.ts");
  }
);

testWalk(
  async (d: string): Promise<void> => {
    await mkdir(d + "/a");
    await mkdir(d + "/a/yo");
    await touch(d + "/a/yo/x.ts");
  },
  async function globInWalkFolderWildcard(): Promise<void> {
    const arr = await walkArray(".", {
      match: [
        glob(join("a", "**", "*.ts"), {
          flags: "g",
          globstar: true
        })
      ]
    });
    assertEquals(arr.length, 1);
    assertEquals(arr[0], "a/yo/x.ts");
  }
);

testWalk(
  async (d: string): Promise<void> => {
    await mkdir(d + "/a");
    await mkdir(d + "/a/unicorn");
    await mkdir(d + "/a/deno");
    await mkdir(d + "/a/raptor");
    await touch(d + "/a/raptor/x.ts");
    await touch(d + "/a/deno/x.ts");
    await touch(d + "/a/unicorn/x.ts");
  },
  async function globInWalkFolderExtended(): Promise<void> {
    const arr = await walkArray(".", {
      match: [
        glob(join("a", "+(raptor|deno)", "*.ts"), {
          flags: "g",
          extended: true
        })
      ]
    });
    assertEquals(arr.length, 2);
    assertEquals(arr[0], "a/deno/x.ts");
    assertEquals(arr[1], "a/raptor/x.ts");
  }
);

testWalk(
  async (d: string): Promise<void> => {
    await touch(d + "/x.ts");
    await touch(d + "/x.js");
    await touch(d + "/b.js");
  },
  async function globInWalkWildcardExtension(): Promise<void> {
    const arr = await walkArray(".", {
      match: [glob("x.*", { flags: "g", globstar: true })]
    });
    console.log(arr);
    assertEquals(arr.length, 2);
    assertEquals(arr[0], "x.js");
    assertEquals(arr[1], "x.ts");
  }
);

runIfMain(import.meta);

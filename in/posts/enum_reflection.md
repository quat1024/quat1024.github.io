slug=enum_reflection
title=Reflectively constructing enums at runtime
author=quat
description=Extending Java enums at runtime. What could go wrong?
created_date=Apr 23, 2024
tags=java
subject=java
good=yes
---
It should go without saying that this is a bad idea.

# Reasons *not* to do this

The purpose of an enum is to hold a fixed set of compile-time constants. Code is written assuming these invariants hold. `EnumMap` only counts up the enum values once, allocates an array of the perfect size, and never boundschecks again because there will *never* be more enum constants. Java's new switch expressions throw `IncompatibleClassChangeError` if a new enum value appears out of nowhere. And so on.

If you really want "an enum you can extend at runtime", and you can change *both* the enum *and* all consumers, use a Registry pattern, or a hashmap, or a `public static final String[]`, or *literally anything else*. The only drawbacks to rolling your own enums are losing access to EnumMap, switch-over-enum, and a bit more typing: hashmap is fine, switch-over-enum would break anyway when being extended, and you'll live.

Don't add enum values at runtime. Anyway, here's how to add enum values at runtime.

# Into the Unknown

Here is our unsuspecting enum. I'll give it an argument, just for fun.

```java
public enum TestEnum {
	THING1(10f),
	THING2(20f),
	THING3(30f);

	public final float f;
	TestEnum(float f) { this.f = f; }
}
```

Our goal is to manufacture new instances of TestEnum other than the three provided instances. It'd be nice if methods like `TestEnum.values()` and `TestEnum.valueOf()` worked on our newly minted objects as well.

We'll start with Java 8 and then look at how things have changed in Java 21.

## Anatomy of an enum

What are we working with anyway? The CFR decompiler has an option to disable enum resugaring (`--sugarenums false`). Here's what `TestEnum.class` looks like with that option.

```java
public final class TestEnum extends Enum<TestEnum> {
	public static final /* enum */ TestEnum THING1 = new TestEnum("THING1", 0, 10.0f);
	public static final /* enum */ TestEnum THING2 = new TestEnum("THING2", 1, 20.0f);
	public static final /* enum */ TestEnum THING3 = new TestEnum("THING3", 2, 30.0f);
	private static final /* synthetic */ TestEnum[] $VALUES;

	public final float f;

	public static TestEnum[] values() {
		return (TestEnum[])$VALUES.clone();
	}

	public static TestEnum valueOf(String name) {
		return Enum.valueOf(TestEnum.class, name);
	}

	private TestEnum(String name, int ordinal, float f) {
		super(name, ordinal);
		this.f = f;
	}

	static {
		$VALUES = new TestEnum[]{THING1, THING2, THING3};
	}
}
```

Hey look, it's the "typesafe enum pattern" from Effective Java! Check out how the enum fields have been given a special access modifier "enum". CFR doesn't show it, but the class itself also has the "enum" bit set, which is very important; it's what makes this class an enum class.

The universe of values is stored in a `private static final synthetic TestEnum[]` named `$VALUES`. Enum values are not automatically added to `$VALUES` on construction; it's done in a static initializer. The public `values()` function returns a fresh clone of this array every time you call it, because Java doesn't have immutable array types.

My constructor had a `String` and `int` argument prepended to it for the enum name and ordinal. These get passed up to the `Enum` constructor, where the `.name()` and `.ordinal()` final methods are defined.

There are two more things of note and they're both in `Class`. Class contains an array `enumConstants`, which is its own copy of `$VALUES`, and a `Map<String, Enum> enumConstantDirectory`, which is used in the implementation of `Enum.valueOf`. Both of these fields are `null` until their corresponding getters are called.

## Instantiating it

Unfortunately we can't just call `Constructor#newInstance()`:

```java
//remember the extra parameters!
Constructor<TestEnum> cons = TestEnum.class.getDeclaredConstructor(String.class, int.class, float.class);
cons.setAccessible(true);
TestEnum evil = cons.newInstance("EVIL", 3, 42f);
// -> java.lang.IllegalArgumentException: Cannot reflectively create enum objects
```

`newInstance` checks that you're not instantiating a class with that enum bit set.

```java
public T newInstance(Object... initargs) throws InstantiationException, IllegalAccessException, IllegalArgumentException, InvocationTargetException {
	// [..omitted..]
	
	if ((clazz.getModifiers() & Modifier.ENUM) != 0) //<- checks the enum bit
		throw new IllegalArgumentException("Cannot reflectively create enum objects");
			
	ConstructorAccessor ca = constructorAccessor; // volatile read
	if (ca == null)
		ca = acquireConstructorAccessor(); //<- this sets constructorAccessor as well, for next time
	T inst = (T) ca.newInstance(initargs);
	return inst;
}
```

But, yknow... that `ConstructorAccessor` is looking pretty appealing...

```java
Method acqCaMethod = Constructor.class.getDeclaredMethod("acquireConstructorAccessor");
acqCaMethod.setAccessible(true);
ConstructorAccessor ca = (ConstructorAccessor) acqCaMethod.invoke(cons);

TestEnum evil = (TestEnum) ca.newInstance(new Object[]{"EVIL", 3, 42f});

//it works!
System.out.println(evil.name());    //EVIL
System.out.println(evil.ordinal()); //3
System.out.println(evil.f);         //42.0
```
This works but prints a lot of `warning: sun.reflect.ConstructorAccessor is internal proprietary API and may be removed in a future release` warnings. (They're not wrong; in java 9 these APIs are not exported and you need an `--add-opens` to use them.)

There's another way as well. It's kinda silly but the MethodHandle API doesn't implement any enum checks. Whoops.
```java
MethodHandle consHandle = MethodHandles.lookup().unreflectConstructor(cons);
TestEnum evil = (T) consHandle.invokeWithArguments("EVIL", 3, 42f);
//works
```

All the Enum virtual methods work - name, ordinal, toString, hashcode, even compareTo will work to compare the ordinals.

# The Fabric of Spacetime

Currently neither `.values()` nor `TestEnum.class.getEnumConstants()` contain our new enum, and `valueOf` doesn't recognize its name. Let's fix this.

Look again at that private static field named `$VALUES`. Make a longer copy of that array, insert our new element, and stomp on the old one with reflection, right?
```java
private static <T> T[] concat(Class<T> t, T[] a, T... b) {
	T[] result = (T[]) Array.newInstance(t, a.length + b.length); //i love java
	System.arraycopy(a, 0, result, 0, a.length);
	System.arraycopy(b, 0, result, a.length, b.length);
	return result;
}

Field valuesField = clazz.getDeclaredField("$VALUES");
valuesField.setAccessible(true);
valuesField.set(null, concat(clazz, (T[]) valuesField.get(null), result));
// -> java.lang.IllegalAccessException: Can not set static final [LTestEnum; field TestEnum.$VALUES to [LTestEnum;
```

Not so fast. The JVM is touchy about `private static final` fields for good reason, because the JIT loves to inline, and it can't inline anything that might change. We need to tread carefully.

Fortunately we're in the lawless land of Java 8 and can reflect away all our problems, right? Just ditch the `private` and `final` modifiers!!! What could go wrong!!!

```java
private static Field definalizeField(Field f) throws Throwable {
	f.setAccessible(true);

	Field modifiersField = Field.class.getDeclaredField("modifiers");
	modifiersField.setAccessible(true);
	modifiersField.set(f, (f.getModifiers() | Modifier.PUBLIC) & ~(Modifier.FINAL | Modifier.PRIVATE | Modifier.PROTECTED));
	return f;
}
```

Definalizing the `$VALUES` field allows writing to it with `Field#set`. This fixes the `.values()` method... maybe.

There's still `Class.getEnumConstants` and `valueOf`. These are easy; they read from the `Class.enumConstants` and `Class.enumConstantDirectory` caches. We can just delete them and they'll get reinitialized the next time someone asks for them.

All together now:

```java
@SuppressWarnings("unchecked")
public static <T extends Enum<T>> T makeEnum(Class<T> clazz, String name, int ord, Class<?>[] argTypes, Object... argValues) throws Throwable {
	//prepend the (String, int) arguments and find the constructor
	argTypes = concat(Class.class, new Class<?>[]{String.class, int.class}, argTypes);
	argValues = concat(Object.class, new Object[]{name, ord}, argValues);
	Constructor<T> cons = clazz.getDeclaredConstructor(argTypes);

	//find the constructor
	Constructor<T> cons = clazz.getDeclaredConstructor(argTypes);
	cons.setAccessible(true);
	MethodHandle consHandle = MethodHandles.lookup().unreflectConstructor(cons);

	//instantiate the enum (!!!)
	T result = (T) consHandle.invokeWithArguments(argValues);

	//append to Enum.$VALUES
	Field valuesField = definalizeField(clazz.getDeclaredField("$VALUES")); //hmm...
	valuesField.set(null, concat(clazz, (T[]) valuesField.get(null), result));

	//fix up the caches in Class
	Field enumConstantsField = Class.class.getDeclaredField("enumConstants");
	enumConstantsField.setAccessible(true);
	enumConstantsField.set(clazz, null);
	Field enumConstantDirectoryField = Class.class.getDeclaredField("enumConstantDirectory");
	enumConstantDirectoryField.setAccessible(true);
	enumConstantDirectoryField.set(clazz, null);

	return result;
}
```

# Impenetrable Fortress

I'm having so much fun with my newfound powers!! Let's stamp out hundreds of enums!!

```java
for(int i = 0; i < 500; i++)
	makeEnum(TestEnum.class, "EVIL" + i, i + 3, new Class[]{float.class}, (float) i);

for(int i = 0; i < 503; i++)
	System.out.println(TestEnum.values()[i]);
// -> THING1
//    THING2
//    THING3
//    EVIL0
//    EVIL1
//    ...
//    EVIL497
//    EVIL498
//    EVIL499
```

But add this innocent loop before the code, and it all comes crashing down:

```java
int n = 0;
for(int i = 0; i < 256; i++)
	n += TestEnum.values().hashCode();
System.out.println("The number of the day is: " + n);

...

// -> The number of the day is: -1277708453
//    THING1
//    THING2
//    THING3
//    java.lang.ArrayIndexOutOfBoundsException: 3
```

Here's what's happening:

* In the first loop, `TestEnum.values()` gets called 256 times.
* Because it's a hot method, Hotspot decides it's probably worth optimizing, so it gets fed through the JIT.
* The method contains a reference to a `private static final` field `$VALUES`. Inlining a `private final` field is always okay, because nobody can ever change it. Even with reflection.
* Right?
* In the second loop, I change the field with reflection, breaking the assumption of the JIT compiler.
* In the third loop, I call the compiled `values()` method. It returns stale data.

You can write to the `$VALUES` field all day long and the compiled `.values()` method won't pick up on the changes. If you read `$VALUES` back with reflection, you can even see that it *is* getting written to! The *method* no longer performs a field read at all, despite what it looks like in the source code.

If you interleave calls to `makeEnum` and `values()` you can typically add around 256-ish enums before things start failing, although it really depends how the JIT is feeling. And if you sprinkle breakpoints around in a debugger, you might force the JVM back into interpreted mode, and it'll start working again!

The fundamental problem: reflecting `Field`'s `modifiers` bypassed a core-reflection-API-level check gating a `Field.set` call, but we did not actually change the modifiers of the field in the JVM. It is still just as private and final as ever as far as the JIT is concerned.

## Respite

So is adding enums to `values()` at runtime totally impossible?

Well, even though this reflective method is *hopelessly* fragile and very dependent on JVM implementation details - *in practice*, if enums are only added in moderation, and if they're added as early as possible before other code gets the chance to call Enum.values dozens of times, and if you're not using a crazy JVM: it does work...!

Exactly this system powers Minecraft Forge through about 1.12. Modders have used it every time they want to add a new tool material, armor material, etc.

# Acts of God

The problems arise because `javac` outputs a `private final $VALUES` array, and as we've seen, there's no way to make it not private/final after loading the class.

However, who says we have to load what javac outputted? Definitely one of the funniest features of Java is that the classloading process is fully customizable. We can use the ObjectWeb ASM library to parse a class and return a new class where the private and final modifiers have been scraped off every field named `$VALUES`.

```java
ClassReader reader = new ClassReader(in);
ClassWriter writer = new ClassWriter(0);

ClassVisitor panopticon = new ClassVisitor(Opcodes.ASM9, writer) {
	@Override
	public FieldVisitor visitField(int access, String fName, String descriptor, String signature, Object value) {
		if(fName.equals("$VALUES")) {
			access &= ~(ACC_PRIVATE | ACC_PROTECTED | ACC_FINAL);
			access |= ACC_PUBLIC;
		}
		return super.visitField(access, fName, descriptor, signature, value);
	}
};

reader.accept(panopticon, 0);
byte[] classBytes = writer.toByteArray();
```

Of course in a real application you ~~wouldn't be doing this~~ would only definalize fields belonging to enum classes that you want to extend, etc. Plugging this into a ClassLoader is left as an exercise to the reader (it's wordy). If you load the enum class through this ClassLoader, suddenly the problem with jitting away `$VALUES` disappears because the field is no longer eligible for inlining. You do lose out on the optimization benefits of inlining the field, and you'll have to load most of the rest of your application through this classloader too.

## Can't you just-

Yes, if you're going to modify the bytecode of an enum anyway, you might as well splice in the new enum values while you're at it. It wouldn't even be too hard:

* add new static fields for each enum value you want
* resize the $VALUES array
* emit code that constructs each enum value, sets the static fields, and populates the `$VALUES` array

(In my situation I really do need the ability to add enums at arbitrary points in time though, not only at classload time.)

It would be a bad idea to remove the enum bit from the class. This will break EnumMap and anything else calling `Class.getEnumValues()`, since it returns null when the class doesn't have the enum bit.

There are other things we can do with classloader magic, though. The `Cannot reflectively create enum objects` restriction applies specifically to reflectively invoking a *constructor* for a class with the enum bit set - if we invoke some non-constructor method with reflection, and that method just *happens* to call an enum constructor: hey, not my problem. Turns out it actually is possible to publicly expose an Enum constructor through a "factory method" in bytecode, even if Java source won't let you. The verifier will happily accept your class.

You can write to `$VALUES` from the factory method, too, then you don't have to circumvent `private`. Reflection is still required to clear the `Class.enumConstants` cache.

# The Future

That was Java 8. How do things look on Java 21?

Of course the module system is a pretty significant change; several things we use are not publicly exported by default.

But in the meantime *tons* of stuff was added to `Reflection.fieldFilterMap`. It is a stronger form of encapsulation than the Java module system. If something is not *exported* from a module, you can still find it with `.getDeclareXxxx()` (and possibly pivot from there into a `MethodHandle`, `VarHandle`, or `Unsafe`), or more directly reach it with an `--add-opens`. But if something is added to fieldFilterMap you can't reflect it at all. It's like the field doesn't even exist to the core reflection API.

`fieldFilterMap` now includes *all* fields from most of the core reflection API classes, like `Constructor`, `Field`, and `Method`. Reflecting `ConstructorAccessor` and mutating `Field.modifiers` is not easily possible.

### Constructing the enum

Here are the options:

* Reflect out a ConstructorAccessor and use it to construct the enum.
* Use the MethodHandle trick to construct the enum.
* Use a special classloader that adds a `static` factory method to the enum that constructs the enum for you.

Because `Constructor` has been added to fieldFilterMap, it's impossible to get one. (You'd also need an `add-opens` to refer to it.)

Luckily the `MethodHandle` trick still works, so we can construct the enum with a methodhandle. Bytecode-editing in a factory method is possible too.

### Overwriting $VALUES

* Hack at the `modifiers` field of `Field` to allow a `Field.set` call. Works only until the method gets JITted.
* Use a special classloader that makes `$VALUES` public and non-final, then edit it with regular reflection.
* Use a special classloader, modify the enum to automatically add new entries to `$VALUES`.

`Field` has been added to `fieldFilterMap`. So we *have* to use a custom ClassLoader.

### Clobbering the enum caches

It's still legal to reflect the `Class` fields thankfully, but reading and writing them requires an `add-opens`.

Of course there's also the sledgehammer:

```java
Field uField = Unsafe.class.getDeclaredField("theUnsafe");
uField.setAccessible(true);
Unsafe unsafe = (Unsafe) uField.get(null);

unsafe.putObject(clazz, unsafe.objectFieldOffset(Class.class.getDeclaredField("enumConstants")), null);
unsafe.putObject(clazz, unsafe.objectFieldOffset(Class.class.getDeclaredField("enumConstantDirectory")), null);
```

Apart from that, things actually seem to be working okay!

# Oddities

Actually I lied, the field isn't always named `$VALUES` and looking for a field with that specific name is not a fully reliable way to find the magic enum field. You'd have to analyze the bytecode of `.values()` and see what array it touches to be completely sure.

If you declare a `static MyEnum[] $VALUES` in your class, it's not an error, javac will name its generated field `$VALUES$` instead. If `$VALUES$` is taken too, it will name the field `$VALUES$$`. It'll just keep appending dollar signs until it finds a free name.

If you *keep* making fields with more and more dollar signs until reaching the variable name length limit of 65536 characters, you end up with a `.java` source file well over 2gb in size, which javac chews on for about 45 seconds before crashing:

```
An exception has occurred in the compiler (1.8.0_352). Please file a bug against the Java compiler via the Java bug reporting page (http://bugreport.java.com) after checking the Bug Database (http://bugs.java.com) for duplicates. Include your program and the following diagnostic in your report. Thank you.
java.lang.IllegalArgumentException
	at java.nio.ByteBuffer.allocate(ByteBuffer.java:334)
	at com.sun.tools.javac.util.BaseFileManager$ByteBufferCache.get(BaseFileManager.java:325)
	at com.sun.tools.javac.util.BaseFileManager.makeByteBuffer(BaseFileManager.java:294)
	at com.sun.tools.javac.file.RegularFileObject.getCharContent(RegularFileObject.java:114)
	at com.sun.tools.javac.file.RegularFileObject.getCharContent(RegularFileObject.java:53)
	at com.sun.tools.javac.main.JavaCompiler.readSource(JavaCompiler.java:602)
	at com.sun.tools.javac.main.JavaCompiler.parse(JavaCompiler.java:665)
	at com.sun.tools.javac.main.JavaCompiler.parseFiles(JavaCompiler.java:950)
	at com.sun.tools.javac.main.JavaCompiler.compile(JavaCompiler.java:857)
	at com.sun.tools.javac.main.Main.compile(Main.java:523)
```

So it's impossible to make this part of javac overstep the variable-name length limit, something else crashes first :)
# Syncrate

A simple and flexible state management for Vanilla JS/TS and Web Components.

<strong style="color: tomato;">⚠️ This project is still in Alpha, and is subject
of drastic changes, do NOT use in PRODUCTION!</strong>

## Table of contents

- [Installation](#installation)
- [How to Use](#how-to-use)
- [Implementation Example](#implementation-example)
- [License](#license)
- [Contact](#contact-me)

## Installation

### Using via the CDN (Recommended):

The easiest way to consume the library is to import via the CDN by taking
advantage of ECMAScript Modules:

```html
<script type="module">
  import { defineStore } from 'https://cdn.jsdelivr.net/npm/syncrate@latest/+esm'
</script>
```

The library was designed to be used mostly with Vanilla JavaScript and Vanilla
Web Components, so importing via the CDN is the most straightforward approach as
it does not require any build process.

### Installing as a Package:

Alternatively, you can install the library with your package manager of choice:

```bash
bun install syncrate
```

and then consume as usual:

```typescript
import { defineStore } from 'syncrate'
```

This approach is recommended in case you already have an existing TypeScript
project or you would like to keep all type safe.

## How to Use

**Creating a New Store**

First steps is to use `defineStore` function to instantiate a new store:

```html
<script type="module">
  const store = defineStore('todos', () => ({
    todos: [
      {
        id: 1,
        title: 'Learn about syncrate!'
      },
      {
        id: 2,
        title: 'Share syncrate with my friends :)'
      }
    ]
  }))
</script>
```

The `defineStore` function requires a unique key `name` and a `callback` that
returns an object as initial state.

**Getting values from the Store**

Once the store is defined, you can simply call the `store.get` method passing a
`callback` function that accepts the `state` object as first parameter, and
simply extract the value you want:

```html
<script type="module">
  /* ...code from previous examples */

  const todos = store.get((state) => state.todos)
  console.log(todos) /* return an array of todos */
</script>
```

**Setting a new value to the Store**

Similarly with `store.get` you also have a `store.set` method that can be used
to perform updates:

```html
<script type="module">
  /* ...code from previous examples */

  store.set((state) => ({
    todos: [
      ...state.todos,
      {
        id: 3,
        title: 'Give a GitHub star to the syncrate project :P'
      }
    ]
  }))

  const todos = store.get((state) => state.todos)
  console.log(todos) /* will have all 3 todos */
</script>
```

Note that to retain all the previous todos we need to use the `spread` operator,
and after updating we are creating a new constant to hold the todo values. This
is by design to ensure the state is `immutable`.

However, there are other alternatives to capture the new computed value that you
can see in the following examples.

**Where is the reactivity???**

Since the return type of `store.get` is immutable, how can I tell my UI to
re-render, or how do I capture the new value in a easy way?

Well, we can listen for event changes! 🫡

When the you call `store.set` a new `CustomEvent` is dispatched to the DOM,
announcing the changes. The event name is a combination of the `syncrate:`
prefix + the store key `name` you used when you called `defineStore` function.

That event will also send the changed data in the `event.detail` property, on
which you can capture and update your UI or any state you have set.

Here is an example:

```html
<script type="module">
  /* ...code from previous examples */

  let todos = store.get((state) => state.todos)

  document.addEventListener('syncrate:todos', (event) => {
    if (!event.detail) return
    todos = event.detail
  })

  store.set(() => ({
    todos: [
      ...todos,
      {
        id: 3,
        title: 'Give a GitHub star to the syncrate project :P'
      }
    ]
  }))

  console.log(todos) /* will have all 3 todos */
</script>
```

All store event updates are called in the `document`, and it bubble up by
default. This means that any component withing the `document` will be able to
listen for updates, regardless on where they are located.

Also, If you are mutating the `store` values withing a Web Components, the
`CustomEvent` also have a `composed` default to `true`, this ensures the event
will propagate across the shadow DOM boundary into the standard DOM.

Using `CustomEvent` ensures the logic is decoupled as much as possible from the
component itself, specially when using Web Components.

**CustomEvent options**

If for some reason you would like to customize the behavior of the emitted
event, the `defineStore` function also accepts an optional object for further
customization:

```html
<script type="module">
  const store = defineStore('custom', () => ({ custom: 'value' }), {
    bubbles: true,
    cancelable: true,
    composed: true
  })
</script>
```

## Implementation Example

Here we will create a bare minimal todo app that consumes the store we created
previously withing Web Components.

**Creating a Base Class**

This class include helper methods that allow re-rendering, and it also handles
the shadowDOM for us.

```html
<script type="module">
  /* ...code from previous examples */

  class BaseElement extends HTMLElement {
    constructor() {
      super()
      this.shadow = this.attachShadow({ mode: 'open' })
      this.styles = document.createElement('style')
      this.template = document.createElement('template')
    }

    /* helper to update the component */
    #requestUpdate() {
      while (this.shadow.firstChild) {
        this.shadow.lastChild.remove()
      }

      const host = this.template.content.cloneNode(true)

      if (this.styles.textContent.length > 0) {
        host.prepend(this.styles)
      }

      this.shadow.appendChild(host)
    }

    /* method used to construct the markup */
    render() {
      this.#requestUpdate()
    }

    /* lifecycle method that runs whenever the component is mounted in the DOM */
    connectedCallback() {
      this.render()
    }
  }
</script>
```

**The TodoList Component**

Our `TodoList` compontent will inherit our `BaseElement`, so it comes will all
the helpers we created in the previous steps.

Inside this component, we also consume our `store` by setting an internal state.

```html
<script type="module">
  /* ...code from previous examples */

  class TodoList extends BaseElement {
    constructor() {
      super()

      /* use the store to get all the initial todos */
      this.todos = store.get((state) => state.todos)
    }

    connectedCallback() {
      super.connectedCallback()

      /* listener for our our custom event */
      document.addEventListener('syncrate:todos', (event) => {
        if (!event.detail) return

        /* update the internal state with the new value */
        this.todos = event.detail

        /* trigger a re-render when the state changes */
        this.render()
      })
    }

    render() {
      /* construct a list of todos */
      const items = this.todos?.map(
        (todo) => String.raw`<li>${todo.title}</li>`
      )

      /* inject the result in the template */
      this.template.innerHTML = String.raw`
        <ul>
          ${items.join('')}
        </ul>
      `

      /* request component re-render */
      super.render()
    }
  }

  /* don't forget to define the element */
  customElements.define('todo-list', TodoList)
</script>
```

**The TodoUpdater Component**

Our `TodoUpdater` will have a simple button that upon click adds a new todo into
our store. Since the `TodoList` is listening for changes, it will re-render
accordantly.

```html
<script type="module">
  /* ...code from previous examples */

  class TodoUpdater extends BaseElement {
    constructor() {
      super()
    }

    connectedCallback() {
      super.connectedCallback()

      /* bind handler to the button */
      const button = this.shadow.querySelector('button')
      button?.addEventListener('click', this.handleClick)
    }

    handleClick() {
      /* set new list of todos */
      store.set((state) => ({
        todos: [
          ...state.todos,
          {
            id: 3,
            title: 'Give a GitHub to the syncrate project :P'
          }
        ]
      }))
    }

    render() {
      this.template.innerHTML = String.raw`<button>Update Todos</button>`
      super.render()
    }
  }

  /* don't forget to define the element */
  customElements.define('todo-updater', TodoUpdater)
</script>
```

\* Ideally you would inject the initial value of the store via observed
attributes or other methods, just wanted to give a simple example here 😉.

**Use the Components**

Finally, simply mount the components in the `<body>`, click the `Update Todos`
button and see the reactivity happening 🎆!

```html
<!-- ...code from previous examples -->

<body>
  <todo-list></todo-list>
  <todo-updater></todo-updater>
</body>
```

## License

This is an open-source library and is available under the
[**MIT License**](LICENSE). You are free to use, modify, and distribute the code
in accordance with the terms of the license.

## Contact me

Linkedin: [feliperdamaceno](https://www.linkedin.com/in/feliperdamaceno)

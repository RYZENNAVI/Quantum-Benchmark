# Frontend Documentation

This document provides a technical overview of the frontend application
for the Quantum Encoding Benchmarking Framework. It is intended for
developers who will be working on or extending the codebase.

-----

## 1. Overview

This frontend provides a web-based user interface for interacting with
the quantum benchmarking backend. It allows users to visually construct,
manage, and submit quantum circuits for evaluation.

### **Core Technologies**

* **UI Framework**: [React](https://react.dev/) 18 
* **Build Tool**: [Vite](https://vitejs.dev/) 
* **State Management**:
[Zustand](https://github.com/pmndrs/zustand) 
* **Drag & Drop**:
[@dnd-kit](https://dndkit.com/) 
* **Styling**: [Tailwind
CSS](https://tailwindcss.com/) 
* **UI Components**:
[shadcn/ui](https://ui.shadcn.com/) & Radix UI 
* **Package Manager**: [pnpm](https://pnpm.io/)

### **Architectural Approach**

The application is structured as a modern, single-page application
(SPA).

* **State Management**: The core application state, particularly
the complex state of the quantum circuit (its gates, wires, and
parameters), is managed globally using **Zustand**. The central
store can be found in `src/stores/useCircuitStore.ts`. This
lightweight, hook-based approach provides a simple and powerful way to
manage shared state without the boilerplate of other libraries.

* **Component Interaction**: The main user interaction in the
`QuantumCircuitBuilder` page is powered by the **@dnd-kit**
library, which facilitates the drag-and-drop functionality for placing
gates from the `GatePalette` onto the `CircuitCanvas`.

* **UI Construction**: The UI is built using components from
**shadcn/ui**, which are not a typical component library but rather
a collection of accessible and composable components built on top of the
headless primitives from **Radix UI**. This gives us maximum control
over styling and functionality.

-----

## 2. Project Structure

The `src` directory is organized to separate concerns and promote
modularity.

``` 
/src 
├── components/ # Reusable React components 
│ ├── ui/ #Unstyled, accessible UI primitives (from shadcn/ui) 
│ ├── GateEditor/ #Components related to editing gate parameters 
│ └── *.jsx #Application-specific components (e.g., CircuitCanvas, GatePalette) 
│ ├── constants/ # Static data and configuration arrays 
│ ├── gates.js #Defines the available quantum gates for the palette 
│ └── *.js # Otherconstant data (e.g., mock benchmarks) 
│ ├── contexts/ # React Context providers 
│ ├── lib/ # Utility functions and helper scripts 
│ └── utils.ts # Shared utility functions (e.g., cn for classnames) 
│ ├── pages/ # Top-level route components 
│ └── *.jsx # Each file represents a major view (e.g., QuantumCircuitBuilder) 
│ ├── stores/ # Global state management stores (Zustand) 
│ └── useCircuitStore.ts # The central store for the circuit builder 
│ ├── App.jsx # Main application component with routing setup 
└── main.jsx # Application entry point
```

-----

## 3. Installation and Setup

### **Prerequisites**

* **Node.js**: Version 18.x or later is recommended. 
* **pnpm**: This project uses `pnpm`. If you don't have it, install
it globally via npm: ```bash npm install -g pnpm ```

### **Local Development**

1. **Clone the repository**: ```bash git clone
<your-repository-url> cd frontend ``` 
2. **Install
dependencies**: This command reads the `pnpm-lock.yaml` file to
install the exact versions of all required packages. ```bash pnpm
install ``` 
3. **Run the development server**: This will start
the Vite dev server, typically on `http://localhost:5173`. ```bash
pnpm run dev ```

-----

## 4. Available Scripts

The following scripts are defined in `package.json` and can be run
with `pnpm <script-name>`:

* `pnpm dev`: Starts the application in development mode with Hot Module Replacement (HMR). 
* `pnpm build`: Compiles and bundles the application for production into the `dist` folder. 
* `pnpm lint`: Runs the ESLint linter to check for code quality and style issues. 
* `pnpm preview`: Starts a local server to preview the production build from the `dist` folder.

-----

## 5. Customization

### **Adding New Quantum Gates**

The list of available quantum gates that appear in the `GatePalette`
is driven by a configuration file. To add a new gate:

1. Navigate to `src/constants/gates.js`. 
2. Add a new JavaScript object to the `GATES` array. 
3. The object must have the following structure: ```javascript { id: 'unique-gate-id', // e.g.,
'hadamard' name: 'H', // The label that appears on the gate //
Potentially other properties like description, parameters, etc. } ```

The application will automatically pick up the new gate and render it in
the palette, ready to be used in the circuit builder.

-----

## 6. Issues and Solutions

### **Missing `nanoid` Module**

* **Symptom**: The application fails to start after `pnpm install` with an error message indicating that the `nanoid` module
cannot be found. 
* **Cause**: This can occur if a dependency relies
on `nanoid` but it was not explicitly saved in `package.json`. 
* **Solution**: Manually add the dependency to your project:
```bash pnpm add nanoid ``` Then, try running `pnpm run dev`
again.

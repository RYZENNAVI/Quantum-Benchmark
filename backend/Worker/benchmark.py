import pennylane as qml
import jax
import jax.numpy as jnp
import optax
import re
import loading


def run_benchmark(ansatz_id: int, dataset_id: int, encoding_id: int, n_qubits: int, measure_wire: int, n_epochs=100, learning_rate=0.2, n_layers=2, progress_update=None) -> dict:
    X_train, X_test, y_train, y_test = loading.load_dataset_by_id(dataset_id, n_qubits)

    ansatz_func   = loading.load_ansatz_by_id(ansatz_id)
    encoding_spec = loading.load_encoding_from_db(encoding_id, n_qubits)
    dev           = qml.device("default.qubit", wires=n_qubits)

    def simple_encoding(x):
        gates = encoding_spec['gates']
        for gate in gates:
            gate_type = gate.get('gate')
            wires = gate.get('wires', [])
            params = gate.get('params', [])
            # Map params-Strings wie 'theta_0' oder 'x_1' auf x[index]
            resolved_params = []
            for p in params:
                if isinstance(p, (int, float)):
                    resolved_params.append(p)
                elif isinstance(p, str):
                    m = re.match(r"input_(\d+)", p)
                    if m:
                        idx = int(m.group(1))
                        if idx < len(x):
                            resolved_params.append(x[idx])
                        else:
                            raise ValueError(f"Parameter-Index {idx} außerhalb von x (len={len(x)})")
                    else:
                        raise ValueError(f"Unbekanntes params-Format: {p}")
                else:
                    raise ValueError(f"Unbekannter Parametertyp: {type(p)}")
            # Gate anwenden
            if gate_type == 'RY':
                qml.RY(*resolved_params, wires=wires)
            elif gate_type == 'RX':
                qml.RX(*resolved_params, wires=wires)
            elif gate_type == 'RZ':
                qml.RZ(*resolved_params, wires=wires)
            elif gate_type == 'H':
                qml.Hadamard(wires=wires)
            elif gate_type == 'X':
                qml.PauliX(wires=wires)
            elif gate_type == 'Z':
                qml.PauliZ(wires=wires)
            elif gate_type == 'CNOT':
                qml.CNOT(wires=wires)
            else:
                raise ValueError(f"Unbekanntes Gate: {gate_type}")

    @qml.qnode(dev, interface="jax")
    def circuit(x, params):
        simple_encoding(x)
        ansatz_func(params, wires=range(n_qubits))
        return qml.expval(qml.PauliZ(measure_wire))

    @qml.qnode(dev, interface="jax")
    def kernel_circuit(x1, x2):
        simple_encoding(x1)
        qml.adjoint(simple_encoding)(x2)
        return qml.expval(qml.Identity(0))

    def circuit_classification():
        def cost(params, x, y):
            preds = jax.vmap(lambda xi: circuit(xi, params))(x)
            labels = 1 - 2 * y  # map {0,1} → {+1, -1}
            return jnp.mean((preds - labels) ** 2)
        cost = jax.jit(cost)

        @jax.jit
        def predict(x, params):
            return jax.vmap(lambda xi: circuit(xi, params))(x)
        key = jax.random.PRNGKey(0)
        shape = ansatz_func.shape(n_layers=n_layers, n_wires=n_qubits)
        params = 0.01 * jax.random.normal(key, shape)
        optimizer = optax.adam(learning_rate=learning_rate)
        opt_state = optimizer.init(params)

        @jax.jit
        def step(params, opt_state, x, y):
            loss, grads = jax.value_and_grad(cost)(params, x, y)
            updates, opt_state = optimizer.update(grads, opt_state)
            new_params = optax.apply_updates(params, updates)
            return new_params, opt_state, loss
        training_losses = []
        for i in range(n_epochs):
            params, opt_state, loss = step(params, opt_state, X_train, y_train)
            training_losses.append(float(loss))
            if progress_update:
                progress_update(i, n_epochs)
        train_predictions = predict(X_train, params)
        test_predictions  = predict(X_test, params)
        train_labels      = (train_predictions < 0).astype(int)
        test_labels       = (test_predictions < 0).astype(int)
        train_accuracy    = jnp.mean(train_labels == y_train)
        test_accuracy     = jnp.mean(test_labels == y_test)
        return {
            "training_accuracy": float(train_accuracy),
            "test_accuracy":     float(test_accuracy),
            "final_loss":        training_losses[-1],
            "training_losses":   training_losses
        }

    circuit_results = circuit_classification()

    results = {
        "loss": circuit_results["final_loss"],
        "accuracy": circuit_results["test_accuracy"]
    }

    return results



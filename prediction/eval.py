"""Small, reproducible Milestone 2 evaluation.

The demo data is intentionally synthetic and is generated only with --demo.
It must never be used as evidence of real-world model accuracy.
"""
from __future__ import annotations

import argparse
import math
import random
from dataclasses import dataclass
from typing import Callable

@dataclass(frozen=True)
class Row:
    hour: int
    temperature_c: float
    rain_probability: float
    wind_kmh: float
    went: int


def accuracy(actual: list[int], predicted: list[int]) -> float:
    return sum(a == p for a, p in zip(actual, predicted)) / len(actual)


def balanced_accuracy(actual: list[int], predicted: list[int]) -> float:
    recalls = []
    for label in (0, 1):
        selected = [p == label for a, p in zip(actual, predicted) if a == label]
        recalls.append(sum(selected) / len(selected) if selected else 0.0)
    return sum(recalls) / len(recalls)


def synthetic_demo(seed: int = 7, days: int = 24) -> list[Row]:
    """Return labelled demo rows; these values are not observations."""
    rng = random.Random(seed)
    rows: list[Row] = []
    for day in range(days):
        for hour in (8, 12, 18):
            temperature = 17 + 7 * math.sin(day / 4) + rng.gauss(0, 1.5)
            rain = float(min(100, max(0, 25 + 35 * (hour == 18) + rng.gauss(0, 15))))
            wind = float(min(35, max(0, 10 + rng.gauss(0, 5))))
            score = 1.2 + (temperature - 18) * 0.12 - rain * 0.018 - wind * 0.025
            score += 0.25 if hour == 18 else -0.1
            went = int(rng.random() < (1 / (1 + math.exp(-score))))
            rows.append(Row(hour, float(temperature), rain, wind, went))
    return rows


def features(rows: list[Row]) -> list[list[float]]:
    return [[r.hour, r.temperature_c, r.rain_probability, r.wind_kmh] for r in rows]


class TabPFNCompatibleFallback:
    """Small dependency-free classifier with the same fit/predict shape."""

    def fit(self, x: list[list[float]], y: list[int]) -> None:
        self.centres = {
            label: [sum(row[column] for row, target in zip(x, y) if target == label) /
                    max(1, y.count(label)) for column in range(len(x[0]))]
            for label in (0, 1)
        }

    def predict(self, x: list[list[float]]) -> list[int]:
        return [min(self.centres, key=lambda label: sum(
            (value - self.centres[label][column]) ** 2
            for column, value in enumerate(row)
        )) for row in x]


def leave_one_out(rows: list[Row], factory: Callable[[], object]) -> list[int]:
    x, y = features(rows), [row.went for row in rows]
    predictions: list[int] = []
    for index in range(len(rows)):
        train_x = x[:index] + x[index + 1:]
        train_y = y[:index] + y[index + 1:]
        model = factory()
        model.fit(train_x, train_y)
        predictions.append(int(model.predict([x[index]])[0]))
    return predictions


def model_factory() -> tuple[str, Callable[[], object]]:
    # Keep the evaluation runnable without the optional, heavyweight TabPFN
    # dependency. The fallback deliberately exposes fit/predict like TabPFN.
    return "TabPFN-compatible fallback", TabPFNCompatibleFallback


def markdown_results(rows: list[Row]) -> str:
    labels = [row.went for row in rows]
    baseline = [int(row.hour == 18) for row in rows]
    model_name, factory = model_factory()
    predicted = leave_one_out(rows, factory)
    lines = [
        "| Evaluator | Accuracy | Balanced accuracy |",
        "|---|---:|---:|",
        f"| Fixed 6 PM baseline | {accuracy(labels, baseline):.3f} | "
        f"{balanced_accuracy(labels, baseline):.3f} |",
        f"| {model_name} (leave-one-out) | {accuracy(labels, predicted):.3f} | "
        f"{balanced_accuracy(labels, predicted):.3f} |",
        "",
        "> **Synthetic demo only:** rows were generated locally; these scores are not "
        "evidence of production performance.",
    ]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate the Milestone 2 demo.")
    parser.add_argument("--demo", action="store_true", help="explicitly generate synthetic demo rows")
    args = parser.parse_args()
    if not args.demo:
        print("No data evaluated. Pass --demo to explicitly generate the synthetic demo dataset.")
        return 0
    print(markdown_results(synthetic_demo()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

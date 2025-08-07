import subprocess
import datetime
import os
import sys
from pathlib import Path

"""Utility to run pytest and store the full console output in a timestamped
log file for easier sharing / debugging.

Usage (from backend directory):

    python run_tests_save_report.py

This will create if necessary a folder named *test_reports* next to this
script and write a file such as ``pytest_report_20250615_142501.txt`` with the
complete stdout / stderr produced by pytest.  The script forwards the exit
code of pytest so it can be used in CI pipelines as a drop-in replacement.
"""


def main() -> None:
    # Destination directory ``backend/test_reports``
    report_dir: Path = Path(__file__).with_suffix("").parent / "test_reports"
    report_dir.mkdir(parents=True, exist_ok=True)

    # Always overwrite/append the same file for quick access
    report_path: Path = report_dir / "pytest_report.txt"

    # Run pytest and capture stdout+stderr
    print(f"[~] Running pytest … output will be saved to {report_path}\n", flush=True)

    with report_path.open("w", encoding="utf-8") as log_file:
        process = subprocess.Popen(
            [sys.executable, "-m", "pytest", "-q"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )

        # Stream output to console and file simultaneously
        assert process.stdout is not None  # for type checker
        for line in process.stdout:
            print(line, end="")
            log_file.write(line)

        process.wait()

    print(f"\n[✓] Test run completed. Report saved to {report_path}")
    sys.exit(process.returncode)


if __name__ == "__main__":
    main() 
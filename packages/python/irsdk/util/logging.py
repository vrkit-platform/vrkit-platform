from enum import Enum


class LogLevel(Enum):
    DEBUG = "DEBUG".ljust(5, ' ')
    INFO = "INFO".ljust(5, ' ')
    WARN = "WARN".ljust(5, ' ')
    ERROR = "ERROR".ljust(5, ' ')


def log(level: LogLevel, msg: str) -> None:
    print(f"[{level.value}] > {msg}")


def debug(msg: str) -> None:
    log(LogLevel.DEBUG, msg)


def info(msg: str) -> None:
    log(LogLevel.INFO, msg)


def warn(msg: str) -> None:
    log(LogLevel.WARN, msg)


def error(msg: str) -> None:
    log(LogLevel.ERROR, msg)

// P2P-STORE-001 v1: durable local storage for the offline workflow core.
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { applyEvent, createCase } from './workflow.mjs';

export class CaseStore {
  #db;
  #selectCase;
  #insertCase;
  #updateCase;
  #insertEvent;
  #selectEvents;
  #beforeCommit;

  constructor(filePath, { beforeCommit } = {}) {
    if (typeof filePath !== 'string' || !filePath.trim()) throw new Error('Database path required');
    if (beforeCommit !== undefined && typeof beforeCommit !== 'function') throw new TypeError('beforeCommit must be a function');
    mkdirSync(dirname(filePath), { recursive: true });
    this.#db = new DatabaseSync(filePath);
    this.#beforeCommit = beforeCommit;
    this.#db.exec(`
      PRAGMA busy_timeout = 5000;
      PRAGMA synchronous = FULL;
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        request TEXT NOT NULL,
        state_json TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS case_events (
        case_id TEXT NOT NULL REFERENCES cases(id),
        sequence INTEGER NOT NULL,
        event_id TEXT NOT NULL,
        event_json TEXT NOT NULL,
        PRIMARY KEY (case_id, sequence),
        UNIQUE (case_id, event_id)
      );
    `);
    this.#selectCase = this.#db.prepare('SELECT state_json FROM cases WHERE id = ?');
    this.#insertCase = this.#db.prepare('INSERT INTO cases (id, request, state_json) VALUES (?, ?, ?)');
    this.#updateCase = this.#db.prepare('UPDATE cases SET state_json = ? WHERE id = ?');
    this.#insertEvent = this.#db.prepare('INSERT INTO case_events (case_id, sequence, event_id, event_json) VALUES (?, ?, ?, ?)');
    this.#selectEvents = this.#db.prepare('SELECT event_json FROM case_events WHERE case_id = ? ORDER BY sequence');
  }

  #transaction(work) {
    // BEGIN IMMEDIATE serializes the read -> reduce -> write sequence across processes.
    this.#db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      this.#db.exec('COMMIT');
      return result;
    } catch (error) {
      try { this.#db.exec('ROLLBACK'); } catch { /* Commit may already have ended the transaction. */ }
      throw error;
    }
  }

  create(id, request) {
    const state = createCase(id, request);
    return this.#transaction(() => {
      this.#insertCase.run(id, request, JSON.stringify(state));
      return state;
    });
  }

  get(id) {
    const row = this.#selectCase.get(id);
    return row ? JSON.parse(row.state_json) : null;
  }

  events(id) {
    return this.#selectEvents.all(id).map(row => JSON.parse(row.event_json));
  }

  append(id, event) {
    // The reducer and the journal see the same JSON event, including key order.
    const eventJson = JSON.stringify(event);
    if (eventJson === undefined) throw new Error('JSON event required');
    const storedEvent = JSON.parse(eventJson);
    return this.#transaction(() => {
      const current = this.get(id);
      if (!current) throw new Error('Case not found');
      const next = applyEvent(current, storedEvent);
      if (next.events.length === current.events.length) return next;
      this.#insertEvent.run(id, next.events.length, storedEvent.id, eventJson);
      this.#updateCase.run(JSON.stringify(next), id);
      this.#beforeCommit?.();
      return next;
    });
  }

  close() {
    this.#db.close();
  }
}

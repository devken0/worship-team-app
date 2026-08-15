"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Button, IconButton } from "@/components/ui";
import { XIcon } from "@/components/icons";

/** Live overlay + icon-button samples for the design workbench. */
export default function ModalDemo() {
  const [centre, setCentre] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="secondary" onClick={() => setCentre(true)}>
          Centre modal
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setSheet(true)}>
          Sheet modal
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setConfirm(true)}>
          Confirm dialog
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted">Icon buttons:</span>
        <IconButton label="Ghost icon button">
          <XIcon size={18} />
        </IconButton>
        <span className="rounded-lg bg-black/60 p-1">
          <IconButton label="Scrim icon button" variant="scrim">
            <XIcon size={18} />
          </IconButton>
        </span>
      </div>

      <Modal
        open={centre}
        onClose={() => setCentre(false)}
        title="Centre modal"
        variant="center"
      >
        <p className="mt-1.5 text-sm text-muted">
          Compact card, bottom-sheet on small screens. Escape and backdrop click
          close it; focus is trapped and returned to the trigger.
        </p>
        <Button size="sm" className="mt-4" onClick={() => setCentre(false)}>
          Close
        </Button>
      </Modal>

      <Modal
        open={sheet}
        onClose={() => setSheet(false)}
        title="Sheet modal"
        variant="sheet"
      >
        <p className="mt-1.5 text-sm text-muted">
          Tall scrolling panel with a floating close button on the backdrop, so
          the card itself stays clean enough to screenshot.
        </p>
      </Modal>

      <ConfirmDialog
        open={confirm}
        title="Delete this recording?"
        description="This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => setConfirm(false)}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}

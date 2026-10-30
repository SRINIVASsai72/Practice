import { QRCodeSVG } from "qrcode.react";

export default function TicketQRCode({ bookingReference }) {
  if (
    typeof bookingReference !== "string" ||
    !bookingReference.trim()
  ) {
    return (
      <div className="rounded-xl bg-red-50 p-4 text-center text-sm text-red-600">
        Booking reference is unavailable.
      </div>
    );
  }

  const reference = bookingReference.trim();

  const qrValue = `EVENTPULSE:BOOKING:${reference}`;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-md">

      {/* Header */}
      <div className="mb-5 text-center">
        <h3 className="text-xl font-bold text-indigo-600">
          EventPulse
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Digital Booking Ticket
        </p>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="rounded-xl border-2 border-indigo-100 bg-white p-4">
          <QRCodeSVG
            value={qrValue}
            size={200}
            level="H"
            bgColor="#FFFFFF"
            fgColor="#312E81"
            marginSize={2}
            title="EventPulse Booking QR Code"
          />
        </div>
      </div>

      {/* Booking Reference */}
      <div className="mt-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Booking Reference
        </p>

        <p className="mt-2 break-all font-mono text-lg font-bold text-gray-800">
          {reference}
        </p>
      </div>

      {/* Ticket Information */}
      <div className="mt-5 rounded-xl bg-indigo-50 p-4">
        <p className="text-center text-sm text-indigo-700">
          Present your booking reference to the event organizer
          for verification.
        </p>
      </div>

      {/* Security Notice */}
      <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
        This QR code is a booking identification token only.
        It does not guarantee entry. The organizer must verify
        the booking status using the backend system.
      </p>

    </div>
  );
}
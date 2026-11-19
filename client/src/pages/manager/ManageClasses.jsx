import { useEffect, useState } from "react";
import { CalendarDays, Clock, Users } from "lucide-react";
import api from "../../api/axios";

export default function ManageClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get("/classes");
        setClasses(response.data.classes);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load dance classes.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  if (loading) {
    return <p className="p-6 text-zinc-400">Loading dance classes...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-400">{error}</p>;
  }

  return (
    <section className="space-y-8 text-white">
      <div>
        <h1 className="text-3xl font-bold">Manage Dance Classes</h1>

        <p className="mt-2 text-zinc-400">
          View upcoming dance classes at Freedom Dance Studio.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Upcoming Classes"
          value={classes.length}
          icon={CalendarDays}
        />

        <StatCard
          title="Confirmed Bookings"
          value={classes.reduce(
            (total, item) => total + item.confirmedBookings,
            0,
          )}
          icon={Users}
        />

        <StatCard
          title="Available Spots"
          value={classes.reduce(
            (total, item) => total + item.availableSpots,
            0,
          )}
          icon={Clock}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900">
        <table className="w-full min-w-[750px] text-left text-sm">
          <thead className="border-b border-white/10 text-zinc-400">
            <tr>
              <th className="p-4">Class</th>
              <th className="p-4">Instructor</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Price</th>
              <th className="p-4">Bookings</th>
              <th className="p-4">Available</th>
            </tr>
          </thead>

          <tbody>
            {classes.map((danceClass) => (
              <tr
                key={danceClass.id}
                className="border-b border-white/5 hover:bg-white/5"
              >
                <td className="p-4">
                  <p className="font-semibold">{danceClass.title}</p>

                  <p className="text-xs text-zinc-400">{danceClass.level}</p>
                </td>

                <td className="p-4">
                  {danceClass.instructor?.firstName}{" "}
                  {danceClass.instructor?.lastName}
                </td>

                <td className="p-4">
                  {new Date(danceClass.startsAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>

                <td className="p-4">
                  {danceClass.priceCents === 0
                    ? "FREE"
                    : `$${(danceClass.priceCents / 100).toFixed(2)}`}
                </td>

                <td className="p-4">{danceClass.confirmedBookings}</td>

                <td className="p-4">{danceClass.availableSpots}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {classes.length === 0 && (
          <div className="p-10 text-center text-zinc-400">
            No upcoming classes found.
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{title}</p>

        <Icon className="h-5 w-5 text-amber-400" />
      </div>

      <h2 className="mt-4 text-3xl font-bold">{value}</h2>
    </div>
  );
}

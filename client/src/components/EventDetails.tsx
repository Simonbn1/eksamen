import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Circles } from "react-loader-spinner";
import "./style/EventDetails.css";

interface EventDetailsProps {
  title: string;
  description: string;
  time: string;
  location: string;
  organizerName: string;
  organizerPhoto: string;
}

const EventDetails: React.FC = () => {
  const { eventTitle } = useParams<{ eventTitle: string }>();
  const [eventDetails, setEventDetails] = useState<EventDetailsProps | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/api/event/${eventTitle}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch event details");
        }
        const data = await response.json();
        setEventDetails(data);
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventTitle]);

  if (loading) {
    return (
      <div className="loader-container">
        <Circles height="80" width="80" color="#4fa94d" ariaLabel="loading" />
      </div>
    );
  }

  if (!eventDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="event-details">
      <h1>{eventDetails.title}</h1>
      <p>{eventDetails.description}</p>
      <p>
        <strong>Time:</strong> {new Date(eventDetails.time).toLocaleString()}
      </p>
      <p>
        <strong>Location:</strong> {eventDetails.location}
      </p>
      <div className="organizer-info">
        <img
          src={eventDetails.organizerPhoto}
          alt={eventDetails.organizerName}
        />
        <p>{eventDetails.organizerName}</p>
      </div>
    </div>
  );
};

export default EventDetails;

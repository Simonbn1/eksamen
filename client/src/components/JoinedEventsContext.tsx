import React, { createContext, useState, useContext, ReactNode } from "react";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
}

interface JoinedEventsContextType {
  joinedEvents: Event[];
  addJoinedEvent: (event: Event) => void;
}

const JoinedEventsContext = createContext<JoinedEventsContextType | undefined>(
  undefined,
);

export const JoinedEventsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [joinedEvents, setJoinedEvents] = useState<Event[]>([]);

  const addJoinedEvent = (event: Event) => {
    setJoinedEvents((prevEvents) => [...prevEvents, event]);
  };

  return (
    <JoinedEventsContext.Provider value={{ joinedEvents, addJoinedEvent }}>
      {children}
    </JoinedEventsContext.Provider>
  );
};

export const useJoinedEvents = () => {
  const context = useContext(JoinedEventsContext);
  if (!context) {
    throw new Error(
      "useJoinedEvents must be used within a JoinedEventsProvider",
    );
  }
  return context;
};

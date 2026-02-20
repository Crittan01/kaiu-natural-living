import ChatList from "../components/dashboard/ChatList";
import { Outlet } from "react-router-dom";

export default function Dashboard() {
    return (
        <div className="flex h-full">
            <ChatList />
            <div className="flex-1 h-full overflow-hidden">
                <Outlet />
            </div>
        </div>
    );
}

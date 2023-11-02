import { React } from 'react';
import "./simple_page.css";


export const Help = () => {
    return (
        <div className="todoqu-simple-text" style={{ textAlign: "left" }}>
            <p>
                Juggling infrequent tasks is easier when they're broken down and spread out. Instead of losing a whole day to chores, ToDoQu lets you tackle them in brief, manageable moments. This way, your Saturdays are saved, and your home stays orderly.
            </p>

            <h2 id="an-example">How It Works</h2>

            <p>
                Take cleaning a living room: it's not one task, but many. With ToDoQu, you can schedule each part—like vacuuming or dusting skirting boards—on its own timeline. Get reminders for vacuuming every 5 to 9 days, or nudge yourself to declutter the coffee table daily. ToDoQu allows you to set the frequency each task needs, and complete them on your own time.
            </p>

            <p>
                The key is to keep tasks as small as possible, while keeping them distinct but not fragmented. "Do the laundry" is a single, clear task, whereas "Put the laundry in" and "Take the laundry out" are unnecessarily split.
            </p>

            <h2 id="brownie-points">Tracking Effort</h2>

            <p>
                ToDoQu also keeps score, awarding brownie points for task completion based on time spent, difficulty, and a touch of randomness. Tasks can be shared or solo, and if a task stops needing to be done without anyone's intervention, they can be dismissed without crediting anyone at all.
            </p>

        </div>
    );
}
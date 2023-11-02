import { React } from 'react';
import "./simple_page.css";


export const Help = () => {
    return (
        <div className="todoqu-simple-text" style={{ textAlign: "left" }}>
            <h1>An atomized approach cleaning</h1>

            <p>
                Life's little tasks, when batched, become chores. ToDoQu offers a way to spread these tasks out, doing a little each day to avoid losing a whole day to cleaning. It's a flexible queue that reminds you to do tasks at your pace, marking them as done and highlighting when they become stale or overdue.
            </p>

            <h2 id="an-example">An Example</h2>

            <p>
                Cleaning a house is daunting and often leads to cutting corners. With ToDoQu, you can set reminders for each task, like vacuuming every 5-9 days, or clearing the coffee table daily with a week's leeway. This method ensures regular maintenance without overwhelming spring-cleaning sessions.
            </p>

            <h2 id="brownie-points">Brownie Points</h2>

            <p>
                ToDoQu also tracks contributions using brownie points, which are awarded based on the task's duration, unpleasantness, and an element of randomness. You can also set a task as done without awarding points, or set a task as being done by several people - each person will get full credit!
            </p>

        </div>
    );
}
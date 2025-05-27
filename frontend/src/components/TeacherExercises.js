import React from "react";
import "../App.css";

function TeacherExercises({ teacherExercises, onSelectExercise }) {
    return (
        <div className="teacher-exercises-container">
            <h3>Teacher-Created Exercises:</h3>
            {teacherExercises.length > 0 ? (
                <ul>
                    {teacherExercises.map((exercise, index) => (
                        <li key={index} onClick={() => onSelectExercise(exercise)}>
                            Exercise {index + 1}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No teacher-created exercises found.</p>
            )}
        </div>
    );
}

export default TeacherExercises;
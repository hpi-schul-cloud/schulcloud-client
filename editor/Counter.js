import React, { useState } from 'react';

function Counter() {
    const [count, setCount] = useState(0)

    return (
        <div>
            Current count is: {count}
            <br />
            <button onClick={() => setCount(count + 1)}>Increase count</button>
        </div>
    );
};

export default Counter;
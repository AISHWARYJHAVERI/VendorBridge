import { useEffect } from 'react'

function Viewuser(props) {
  
    useEffect(() => {
        console.log(props.userId);
    }, [props.userId]);

  return (
    <div>
        {props.userId}
    </div>
  )
}

export default Viewuser
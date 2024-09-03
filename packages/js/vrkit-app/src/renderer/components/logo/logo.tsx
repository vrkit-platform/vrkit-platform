import type { BoxProps } from "@mui/material/Box"
import Box from "@mui/material/Box"

import { forwardRef } from "react"
import { useTheme } from "@mui/material/styles"

import { RouterLink } from "vrkit-app-renderer/routes/components"
import { rem } from "../../styles"

// ----------------------------------------------------------------------

export interface LogoProps extends BoxProps {
  href?: string

  disableLink?: boolean
}

export const Logo = forwardRef<HTMLDivElement, LogoProps>(
  (
    {
      width = "auto",
      height = "100%",
      disableLink = false,
      href = "/",
      sx,
      ...other
    },
    ref
  ) => {
    const theme = useTheme()

    const logo = (
      <svg
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 392.81 71"
      >
        <defs>
          <filter
            id="luminosity-invert"
            x="-2.58"
            y="-2.6"
            width="398"
            height="76"
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feColorMatrix
              result="cm"
              values="-1 0 0 0 1 0 -1 0 0 1 0 0 -1 0 1 0 0 0 1 0"
            />
          </filter>
          <mask
            id="mask"
            x="-2.58"
            y="-2.6"
            width="398"
            height="76"
            maskUnits="userSpaceOnUse"
          >
            <g className="cls-5">
              <image
                width="398"
                height="76"
                transform="translate(-2.58 -2.6)"
                href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAY4AAABMCAYAAAB6U1B3AAAACXBIWXMAAAsSAAALEgHS3X78AAAMcklEQVR4nO2dYY/0rAqGnSfn///lPZ/6pjGAgKg3livZ7OxMpwVFEbDdX2vtrxVFURSFkn+nBSiKoihyUY6jKIqiMFGOoyiKojBRjqMoiqIw8b/TAhR2fr/faRGO8fdXezmKs2Qef1Hj59eUu6qsjZVpgKPrltlQV4HcB5lsPwNc2+9o5y+NPUt7Dh3HTMOhD6BZoyjD9RE1Ce+yL28fINl/rwOSbBynnfXM2Fs1blf3m/b8Sx2HRZDdRHXsSv1QncYpuai2Xm1fmRdOGtlPy8jhafdIXSzX1xy7a/ER0Qaac4g1Dk7Zk6Hjat66oeqD6lA0zEwIz3ff/fL7/SDSVpQMJ2R7rpuZ0/JHOIIoHayRYsTcrLFbMeKghBg1yIlVoZUovaT3Z/HIiMqK6K5v9x2pCs8KHsGpSaCNzdbOpwZnnIL3M47oVK32O6PjTLuqtJ4Y0RgfPJMBAlnkfBMVwlMRx2474+wGxdYz2gcFuh4exxBRK+EiWu4z6XwRNqt2HJoJ9z3AT6cTNHCreqS0w81oB9TpSfot58iBnHZoFsqe1xOZ3UDCdQOgxrMirhxGE8Dz3vu1xK40FWJbavj7+1uaQlppb9YBf6KPymnsZzZ1FFlIt44v7fHTxXEKTf4vk1GOJoNMuqDSp5okpGLgyUI4UqrqazsdT0ecPZI9P2nUWUa2HlWr8DJ957i00wVp4qVWpxlWbKe3JXrRDKr+b03q8LRtUQ5kZ5rqVqfBYVl9R6Gd/Hu7pL7vdSTcRpDVm3S055lyHP2gly560olEpDSQBxyibKM6kaUfTtcNRguNHTW9iFUsop1EsEIv64TP9f97oeOVoz8/9XcElnO6H3I4ygGj5+VR5bthOyXHO8dKDQg0XVBs5KtO42Sd8Tn3+8f6vec19dsqRy9PBF79WlvwkEO0HVXaFJVFTpQ01el7BrRQdYs+5YRaOxsV4lemqaIcF6pdvMmQkrUWv7lUlud61LVP9qvoOKIKPchI+s2sEqKRCoQI8kn08s2G77sZ7cZbsVD6ktOgyLpllbL192fWKCo6yohiyf/jiCg+R8rxfj2bTkPpQCSnZqUPvanPvOecZRSVrka7FVxDRtu4DWriv6Fftv4jJyRHggjn1KRJDF0njgxpNu0ig+sLi04ah+Et1mYjq01/iS2O4/TNUZ7VI0rxltvhM3ovE5p2RdiR934vMjKQdmv11zpdMF6Bpx2z27wVNH2XOQ40RTPt+PoSp1NTGkY1Dup97Xmp83mdEmIuPBLNIgqdmf5B0lftOEYKS6um3UTVMU5FG5r7BvrPkYxqltPRBTdx959z/aBJOXEOw8stDuMmO44gMrKNZOg4LFvQNAqiOpIbBh6igUWz05lrtnJLdamRc6CiCyo99SbjrroZRlEGus1Hy4eib/h9HBxR2xQ116FeU39L7I42tAOEuiM188QRkbNfqb/GebzleH/Gbb+0RIqj/s3c963p04DZ9XxAmfhnWXoD4MkO9xYTTxuoxoGcljGCTGm2UXGacxb//v0j+8qrb4adaFFIdn/LGOCgFoVoOpsdh+fGrRPRhuUzCaTOeugNC82oVrM6whjVOLjvPbzHCNc3I3s8GWWdBn0hUUxEHMh3/np3uqDcVDezU6fwYXUUo3PMjg9pMXDaPovC5Di0g2G0Al6xQvZGGwj5Y4+juC3a4FJXXBpxZ99whe4375TC8/vZHuutrd2OpX70fJaxfSIWgGh6q7bjzoTNu3PZ2aONh9Hum8xERlQIN2X27/U7oyx9JxXe378LfDLV8axs21W1kszRRs9XiuMPSANKM8lbVsSzO8Zu6+tiHhR72Pasqoo29Gi2aGqOy4JlZbY7fTg6pnc0lKN/9xd1/GixcDu32TOHVk+0+YjC5TgsNwWuJnu0od3mOTpHlkHXT6Jadt2rQX0WXTinzqtdLBQFAlufjvsmeiDcEG1Yi+PW7yAiTZ5ZdxVxfeLtqxtz5dqIbgS6LdyK+VlVnp0tqww/e7RBQTkErsiarYAuRRseuXc+ckS6tvbGPOtj1r9Mdv2jFnan5yOOq4rjmaMNDi5N0hdh++2gHKefztnn/C3nResny3OjvM+Y6vv2pi3YrfELJYlsukc5QSS9wxyHZr96pMHfFG1YwnZuEnl/LrXziZUcNSlYnMaupw5oZeGO0zgHry7SYuFmbtMTMbL2kD7iyBxtSGkn6vfzupe5dx4cs7p6jF5KSXkc/OobR63OQyNn5GLltonUQma9s6feelI+cuSmaOONZRcV9xA0yolo01grZKWOjZBjZ39Rtj5yGJF3uXMpqqxOxDJ+M+o3A8KCVsPSiGNk2LOGP5srR++c1uQdOpLzaG3sMCj9I6KK2ePenO4r7QKpl3OUoppxnlkdBoe3LVDbIKowjozrWVVUTr1//fwdzQojQzVAD1ShPKresdJBvEHZhivZdi+TNdIYORLLjsWs9nvzxPowoyNyvx6pcUQY+y3RBpfG0RbMNbtsRg7EIp/1cyvUxIvSV1Lx2yu3tm+oVGQfaX6BzHpmjLg5UhXHb4o2LNsPOaRIgktDWVay3s8jdkpJqZ4TkUdr9CQvOQxq0HMbHb6w+h5xaxvcqNeU4+CKhqsb6pZoI4qoLZ8PHqexquC9sq809kPVjDRO7e/vT+XsRqkw7jtZow7vRokMus2SaX4K2VV1orYRYXBIHRS1nTiiPiBNYhqnIdUCpGv2r1fsUPKgaVNNtPH8TUUumugji3OIIsvYffOFwnhrjmdVne6wWQdyWn4r1MRjcRr9ytdyXU8EoHE4nNyUbqedBkcvc//zPob7bn8e6nMOaoLKNFllktXLrYXx1pLUOG6PNii4lann71k5WtMX60fn4d477Si0KdeoyIiK2KUofiR7tpSVh1v14kBe7E47DsroV3FLtOENZ60F4wh9Nduu39cb6STJaU2/raavI/TyzDo7jfNorVJXXwBtjhpxJOKwNM4Xo40HjQ6aScujLzV59a+1q2NJ1j4lhuI0uOtHp9JGzqM/pidTodyyUEJNUVq5NSUXvquKO+7928Mt0cYs/YBaNcC4c1H3EzzHS5PXyGmgOQwKzmnMyqp1HhZQnccbb30GXS+K2/RzOY6ZVEV/vATnLG4qOnnai1uta77rlaef0EZ5ea3TOOUwRnpS70u/V6AdT1TUUewnKgXNvYdESKrK4jBm0iYWeajfGbBMXCv0G0Ua77+5749WyisjpRXscBqW1J9E1pQVt+h4f347mfQO/9exUSvg3nvfGG1ooVblu52iRQZtNGGJmE4xqnGsupb1Opb7bjKBbh8c2dt9xLTjWNGxM04jc7Tx8J54kVbmVJtq2xm1P7jVL4JT87YZ4qSlHbun23wVnF4ZansU4RHHiJEBeYvgI1A6xKvP6hRVhByWwYHSH1pORXaW698adbzJZjdakBaIGtyOQ/KUUp78/Zr66T+jvjuSCXV1KyHJiqzPyClkGxAIRLTfqgXYTpDtPgJtlI7IloiDcxjSsV6nYf0MHcRQVkpZvf9GkJUiYhJdPRF7nUdGB3ED1jkKdWxo2ZaqohwBF3V493e3dtcqZTQxozDT5hkmOoS29kw6N0QdtyFtGkGwMy0hjsNjyCOH0R9vuX4mz97LilKYHcGlBTnZs+ijPWaHPis3nqCjiWpvJIuOoRGHtc7BIaWytNe/CfQVCTfIEXeGWTktr5SymimYF3vw7jY8bXcjtu+qao0vfnschlQQR298Dcird2TZbiVigtntTKSbRS3v30ZmPaccBzVJWydub3ShPT8SMwMIXVeNrDNR6A7eq3ikSGnkLDKlOHsyp5klRtHhaO5EZ3nEscKYuUGd2eiyDiBtKgVVhyxRU7ZUhgWN07tB36zOnWKJ4+AG42zDaXckZOkYaeWo/Q4anE6ZQZm0I+U4GeVZNyJkRVPfyDp/hf0jJ+k1972Ia99OBh37vt7R95FI8qLJ2vPIl03+zG0+op8HW6P/wyT1Ogu/1tq01KNttNGrG6nR0TtB+1iIjIXDLA+gnLXH032Q8TE8WWzDC6Wf98blDPou+Q+A1Ap01XVu4Svhe3YQ+mAU0RUYSNFgxoXhm5CIozX7wwu9ZM7/P9x8j0oW3bLIKZFpFf+FnZPZI1kLYY6jNfyCGxKWtsqmW2sx/xt+Nbf0gffepxPc0uYcX3CQrQU7jv9OutGBZGtwjh2pveI7oP73vy8x+3BWZJY4jqIoiuJejjxypCiKoshLOY6iKIrCRDmOoiiKwsT/AZRIjgHhR9nOAAAAAElFTkSuQmCC"
              />
            </g>
          </mask>
        </defs>
        <g
          id="Layer_2-2"
          data-name="Layer_2"
        >
          <g>
            <g>
              <path
                className="cls-2"
                d="M84.6.5l-36.2,70H13.4L.6.5h22.2l9.8,50.2-11.7,3.5h12.4L60.1.5h24.5Z"
              />
              <path
                className="cls-2"
                d="M135.7,50.7h-25.6l-4,19.8h-21L99.1.5h67.4c1.87,0,3.58.38,5.15,1.15,1.57.77,2.87,1.8,3.9,3.1,1.03,1.3,1.78,2.78,2.25,4.45.47,1.67.53,3.4.2,5.2l-5.4,26.9c-.53,2.73-1.87,4.98-4,6.75-2.13,1.77-4.6,2.65-7.4,2.65h-4.5l8.9,19.8h-21l-8.9-19.8ZM151.1,34.3c.53,0,1.02-.17,1.45-.5.43-.33.72-.77.85-1.3l2.5-12.9c.13-.73-.02-1.38-.45-1.95-.43-.57-1.02-.85-1.75-.85h-49.2l11.6,3.5-2.8,14h37.8Z"
              />
              <path
                className="cls-2"
                d="M217,42.1l-20.7,16.1,10.5-5.2-3.5,17.5h-21L196.3.5h21l-5,25.1L246.5.5h24.5l-37.8,29.1,27.3,40.9h-24.5l-19-28.4Z"
              />
              <path
                className="cls-2"
                d="M275,70.5L289,.5h21l-3.3,16.3h-12.3l11.6,3.5-10,50.2h-21Z"
              />
              <path
                className="cls-2"
                d="M320.8.5h71.4l-3.3,16.3h-35.7l11.7,3.5-10.1,50.2h-23.3l10.7-53.7h-24.7l3.3-16.3Z"
              />
            </g>
            <g className="cls-3">
              <g className="cls-4">
                <g>
                  <path
                    className="cls-1"
                    d="M84.6.5l-36.2,70H13.4L.6.5h22.2l9.8,50.2-11.7,3.5h12.4L60.1.5h24.5Z"
                  />
                  <path
                    className="cls-1"
                    d="M135.7,50.7h-25.6l-4,19.8h-21L99.1.5h67.4c1.87,0,3.58.38,5.15,1.15,1.57.77,2.87,1.8,3.9,3.1,1.03,1.3,1.78,2.78,2.25,4.45.47,1.67.53,3.4.2,5.2l-5.4,26.9c-.53,2.73-1.87,4.98-4,6.75-2.13,1.77-4.6,2.65-7.4,2.65h-4.5l8.9,19.8h-21l-8.9-19.8ZM151.1,34.3c.53,0,1.02-.17,1.45-.5.43-.33.72-.77.85-1.3l2.5-12.9c.13-.73-.02-1.38-.45-1.95-.43-.57-1.02-.85-1.75-.85h-49.2l11.6,3.5-2.8,14h37.8Z"
                  />
                  <path
                    className="cls-1"
                    d="M217,42.1l-20.7,16.1,10.5-5.2-3.5,17.5h-21L196.3.5h21l-5,25.1L246.5.5h24.5l-37.8,29.1,27.3,40.9h-24.5l-19-28.4Z"
                  />
                  <path
                    className="cls-1"
                    d="M275,70.5L289,.5h21l-3.3,16.3h-12.3l11.6,3.5-10,50.2h-21Z"
                  />
                  <path
                    className="cls-1"
                    d="M320.8.5h71.4l-3.3,16.3h-35.7l11.7,3.5-10.1,50.2h-23.3l10.7-53.7h-24.7l3.3-16.3Z"
                  />
                </g>
              </g>
            </g>
          </g>
        </g>
      </svg>
    )
    return (
      <Box
        ref={ref}
        component={RouterLink}
        href={href}
        width={width}
        height={height}
        aria-label="logo"
        sx={{
          flexShrink: 0,
          flex: "1 0 10rem",
          display: "flex",
          verticalAlign: "middle",
          opacity: 0.16,
          maxHeight: rem(1.5),
          "& .cls-1": {
            fill: "#222",
            stroke: "#fff"
          },

          "& .cls-1, & .cls-2": {
            strokeMiterlimit: 10
          },

          "& .cls-3": {
            mask: "url(#mask)"
          },

          "& .cls-4": {
            opacity: 0.53
          },

          "& .cls-2": {
            fill: "#e6e6e6",
            stroke: "#000"
          },

          "& .cls-5": {
            filter: "url(#luminosity-invert)"
          },
          ...sx
        }}
        {...other}
      >
        {logo}
      </Box>
    )
  }
)
